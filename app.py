import os
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory
from werkzeug.utils import secure_filename
from models import db, Producto, Categoria, Lote, FotoProducto, Venta
from datetime import datetime

# -------------------- CONFIGURATION --------------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join("static", "uploads")
ALLOWED_EXT = {"png", "jpg", "jpeg", "gif"}

app = Flask(__name__)

# Use DATABASE_URL (Postgres on Render). Fallback to local sqlite for dev.
database_url = os.getenv("DATABASE_URL")
if database_url:
    # Render/Heroku style URLs sometimes start with 'postgres://'
    database_url = database_url.replace("postgres://", "postgresql://", 1)
else:
    database_url = "sqlite:///" + os.path.join(BASE_DIR, "stock.db")

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.secret_key = os.getenv("FLASK_SECRET", "supersecreto")

db.init_app(app)

# Ensure upload dir exists
with app.app_context():
    os.makedirs(os.path.join(BASE_DIR, UPLOAD_FOLDER), exist_ok=True)
    db.create_all()

# -------------------- UTILITIES --------------------
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def save_photos(files, product):
    """
    Save uploaded files to disk and create FotoProducto rows.
    Assumes product is already added to session and has an id (commit done).
    """
    # Ensure we don't add more than 4 photos total
    for file in files:
        if not file or not getattr(file, "filename", None):
            continue
        if not allowed_file(file.filename):
            continue
        if len(product.fotos) >= 4:
            flash("⚠️ Solo se permiten hasta 4 fotos por producto", "warning")
            break

        filename = secure_filename(file.filename)
        rel_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        abs_path = os.path.join(BASE_DIR, rel_path)

        # avoid overwrite
        base, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(abs_path):
            filename = f"{base}_{counter}{ext}"
            rel_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            abs_path = os.path.join(BASE_DIR, rel_path)
            counter += 1

        file.save(abs_path)
        foto = FotoProducto(ruta=filename, producto_id=product.id)
        db.session.add(foto)

def delete_product_photos(product):
    """Remove photo files from disk and delete FotoProducto rows."""
    for f in list(product.fotos):
        path = os.path.join(BASE_DIR, app.config["UPLOAD_FOLDER"], f.ruta)
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception:
            # ignore file deletion errors
            pass
        db.session.delete(f)

# -------------------- ROUTES --------------------
@app.route("/")
def index():
    return redirect(url_for("dashboard"))

@app.route("/dashboard")
def dashboard():
    total_ventas = db.session.query(db.func.sum(Venta.cantidad)).scalar() or 0
    total_stock = db.session.query(db.func.sum(Producto.cantidad)).scalar() or 0
    total_batches = Lote.query.count()

    ganancias = 0.0
    for v in Venta.query.all():
        if v.producto:
            costo_unitario = (
                (v.producto.precio_compra or 0) +
                (v.producto.costo_envio_unitario or 0) +
                (v.producto.costo_extra or 0)
            )
            ganancias += (v.precio_venta - costo_unitario) * v.cantidad

    ganancia_estimada = round(ganancias, 2)

    meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
    ventas_mensuales = [0] * 12
    for v in Venta.query.all():
        try:
            ventas_mensuales[v.fecha.month - 1] += v.cantidad
        except Exception:
            pass

    productos_stock = Producto.query.order_by(Producto.cantidad.desc()).limit(6).all()

    return render_template(
        "dashboard.html",
        total_ventas=total_ventas,
        total_stock=total_stock,
        total_batches=total_batches,
        ganancia_estimada=ganancia_estimada,
        meses=meses,
        ventas_mensuales=ventas_mensuales,
        productos_stock=productos_stock,
    )

# --------- Batches (Lotes) ----------
@app.route("/batches")
def batches():
    batches = Lote.query.order_by(Lote.fecha.desc()).all()
    return render_template("batches.html", lotes=batches)

@app.route("/batches/add", methods=["GET", "POST"])
def batch_add():
    if request.method == "POST":
        costo_envio = float(request.form.get("costo_envio", 0) or 0)
        batch = Lote(costo_envio=costo_envio)
        db.session.add(batch)
        db.session.commit()
        flash("✅ Lote creado correctamente", "success")
        return redirect(url_for("batches"))
    return render_template("batch_add.html")

@app.route("/batches/<int:batch_id>/edit", methods=["GET", "POST"])
def batch_edit(batch_id):
    batch = Lote.query.get_or_404(batch_id)
    if request.method == "POST":
        batch.costo_envio = float(request.form.get("costo_envio", 0) or 0)
        db.session.commit()
        flash("✅ Lote actualizado", "success")
        return redirect(url_for("batches"))
    return render_template("edit_batch.html", lote=batch)

@app.route("/batches/<int:batch_id>/delete", methods=["POST"])
def batch_delete(batch_id):
    batch = Lote.query.get_or_404(batch_id)
    for p in list(batch.productos):
        delete_product_photos(p)
        db.session.delete(p)
    db.session.delete(batch)
    db.session.commit()
    flash("🗑️ Lote y productos eliminados", "success")
    return redirect(url_for("batches"))

# --------- Products ----------
@app.route("/products")
def products():
    query = Producto.query

    # filters
    category_id = request.args.get("categoria", type=int)
    if category_id:
        query = query.join(Producto.categorias).filter(Categoria.id == category_id)

    lote_id = request.args.get("lote", type=int)
    if lote_id:
        query = query.filter(Producto.lote_id == lote_id)

    q = request.args.get("q", "").strip()
    if q:
        query = query.filter(Producto.nombre.ilike(f"%{q}%"))

    # ordering
    orden = request.args.get("orden", "nombre")
    if orden == "precio_asc":
        query = query.order_by(Producto.precio_compra.asc())
    elif orden == "precio_desc":
        query = query.order_by(Producto.precio_compra.desc())
    elif orden == "stock_asc":
        query = query.order_by(Producto.cantidad.asc())
    elif orden == "stock_desc":
        query = query.order_by(Producto.cantidad.desc())
    elif orden == "fecha":
        query = query.order_by(Producto.fecha_creacion.desc())
    else:
        query = query.order_by(Producto.nombre)

    productos = query.all()
    categorias = Categoria.query.order_by(Categoria.nombre).all()
    lotes = Lote.query.order_by(Lote.fecha.desc()).all()

    return render_template(
        "products.html",
        productos=productos,
        categorias=categorias,
        lotes=lotes,
        orden=orden,
        categoria_id=category_id,
        lote_id=lote_id,
    )

@app.route("/product/new", methods=["GET", "POST"])
def product_new():
    lotes = Lote.query.all()
    categorias = Categoria.query.order_by(Categoria.nombre).all()

    if request.method == "POST":
        nombre = request.form.get("nombre", "").strip()
        cantidad = int(request.form.get("cantidad", 0) or 0)
        precio_compra = float(request.form.get("precio_compra", 0) or 0)
        costo_envio_unitario = float(request.form.get("costo_envio_unitario", 0) or 0)
        costo_extra = float(request.form.get("costo_extra", 0) or 0)
        margen = float(request.form.get("margen", 0.5) or 0.5)
        lote_id = request.form.get("lote_id") or None
        files = request.files.getlist("fotos")

        if not nombre or cantidad <= 0:
            flash("⚠️ Nombre y stock mayor a 0 son obligatorios", "danger")
            return redirect(url_for("product_new"))

        producto = Producto(
            nombre=nombre,
            cantidad=cantidad,
            precio_compra=precio_compra,
            costo_envio_unitario=costo_envio_unitario,
            costo_extra=costo_extra,
            margen=margen,
            lote_id=lote_id,
        )

        seleccionadas = request.form.getlist("categorias")
        for cid in seleccionadas:
            cat = Categoria.query.get(int(cid))
            if cat:
                producto.categorias.append(cat)

        db.session.add(producto)
        db.session.commit()  # commit so product.id exists for photos

        save_photos(files, producto)
        db.session.commit()
        flash(f"✅ Producto '{producto.nombre}' agregado correctamente", "success")
        return redirect(url_for("products"))

    return render_template("product_new.html", lotes=lotes, categorias=categorias)

@app.route("/batches/<int:batch_id>/product", methods=["GET", "POST"])
def add_product_to_batch(batch_id):
    batch = Lote.query.get_or_404(batch_id)
    categorias = Categoria.query.order_by(Categoria.nombre).all()

    if request.method == "POST":
        nombre = request.form.get("nombre", "").strip()
        cantidad = int(request.form.get("cantidad", 0) or 0)
        precio_compra = float(request.form.get("precio_compra", 0) or 0)
        costo_envio_unitario = float(request.form.get("costo_envio_unitario", 0) or 0)
        costo_extra = float(request.form.get("costo_extra", 0) or 0)
        margen = float(request.form.get("margen", 0.5) or 0.5)

        producto = Producto(
            nombre=nombre,
            cantidad=cantidad,
            precio_compra=precio_compra,
            costo_envio_unitario=costo_envio_unitario,
            costo_extra=costo_extra,
            margen=margen,
            lote_id=batch.id,
        )

        seleccionadas = request.form.getlist("categorias")
        for cid in seleccionadas:
            cat = Categoria.query.get(int(cid))
            if cat:
                producto.categorias.append(cat)

        db.session.add(producto)
        db.session.commit()
        flash(f"✅ Producto agregado al lote {batch.id}", "success")
        return redirect(url_for("batches"))

    return render_template("add_product.html", lote=batch, categorias=categorias)

@app.route("/product/<int:product_id>")
def product_detail(product_id):
    product = Producto.query.get_or_404(product_id)
    return render_template("product_detail.html", producto=product)

@app.route("/product/<int:product_id>/edit", methods=["GET", "POST"])
def product_edit(product_id):
    product = Producto.query.get_or_404(product_id)
    lotes = Lote.query.all()
    categorias = Categoria.query.order_by(Categoria.nombre).all()

    if request.method == "POST":
        product.nombre = request.form.get("nombre", "").strip()
        product.cantidad = int(request.form.get("cantidad", 0) or 0)
        product.precio_compra = float(request.form.get("precio_compra", 0) or 0)
        product.costo_envio_unitario = float(request.form.get("costo_envio_unitario", 0) or 0)
        product.costo_extra = float(request.form.get("costo_extra", 0) or 0)
        product.margen = float(request.form.get("margen", 0.5) or 0.5)
        product.lote_id = request.form.get("lote_id") or None

        seleccionadas = request.form.getlist("categorias")
        product.categorias = []
        for cid in seleccionadas:
            cat = Categoria.query.get(int(cid))
            if cat:
                product.categorias.append(cat)

        files = request.files.getlist("fotos")
        save_photos(files, product)

        db.session.commit()
        flash("✅ Producto actualizado", "success")
        return redirect(url_for("products"))

    return render_template("product_edit.html", producto=product, lotes=lotes, categorias=categorias)

@app.route("/product/<int:product_id>/delete", methods=["POST"])
def product_delete(product_id):
    product = Producto.query.get_or_404(product_id)
    delete_product_photos(product)
    db.session.delete(product)
    db.session.commit()
    flash("🗑️ Producto y fotos eliminados", "success")
    return redirect(url_for("products"))

@app.route("/photo/<int:photo_id>/delete", methods=["POST"])
def photo_delete(photo_id):
    photo = FotoProducto.query.get_or_404(photo_id)
    product_id = photo.producto_id
    path = os.path.join(BASE_DIR, app.config["UPLOAD_FOLDER"], photo.ruta)
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass
    db.session.delete(photo)
    db.session.commit()
    flash("🗑️ Foto eliminada", "success")
    return redirect(url_for("product_edit", product_id=product_id))

# --------- Sales (Ventas) ----------
@app.route("/sales", methods=["GET", "POST"])
def sales():
    productos = Producto.query.filter(Producto.cantidad > 0).all()
    if request.method == "POST":
        producto_id = int(request.form.get("producto_id"))
        cantidad = int(request.form.get("cantidad", 0) or 0)
        precio_venta = float(request.form.get("precio_venta", 0) or 0)

        product = Producto.query.get(producto_id)
        if not product:
            flash("❌ Producto no encontrado", "danger")
            return redirect(url_for("sales"))

        if cantidad <= 0:
            flash("❌ La cantidad debe ser mayor que 0", "danger")
            return redirect(url_for("sales"))

        if cantidad > product.cantidad:
            flash(f"❌ No hay suficiente stock. Disponible: {product.cantidad}", "danger")
            return redirect(url_for("sales"))

        product.cantidad -= cantidad
        venta = Venta(producto_id=product.id, cantidad=cantidad, precio_venta=precio_venta)
        db.session.add(venta)

        costo_total = (product.precio_compra or 0) + (product.costo_envio_unitario or 0) + (product.costo_extra or 0)
        if precio_venta < costo_total:
            flash("⚠️ El precio de venta es menor al costo. Verifique.", "warning")

        db.session.commit()
        flash("✅ Venta registrada", "success")
        return redirect(url_for("sales"))

    ventas = Venta.query.order_by(Venta.fecha.desc()).all()
    return render_template("sales.html", productos=productos, ventas=ventas)

# --------- Inventory (Stock) ----------
@app.route("/inventory")
def inventory():
    productos = Producto.query.order_by(Producto.nombre).all()
    return render_template("inventory.html", productos=productos)

# --------- Categories ----------
@app.route("/categories")
def categories():
    categorias = Categoria.query.order_by(Categoria.nombre).all()
    return render_template("categories.html", categorias=categorias)

@app.route("/category/new", methods=["GET", "POST"])
def category_new():
    if request.method == "POST":
        nombre = request.form.get("nombre", "").strip()
        if nombre:
            if not Categoria.query.filter_by(nombre=nombre).first():
                db.session.add(Categoria(nombre=nombre))
                db.session.commit()
                flash("✅ Categoría creada", "success")
            else:
                flash("❌ La categoría ya existe", "danger")
        return redirect(url_for("categories"))
    return render_template("category_new.html")

@app.route("/category/<int:category_id>/edit", methods=["GET", "POST"])
def category_edit(category_id):
    categoria = Categoria.query.get_or_404(category_id)
    if request.method == "POST":
        nombre = request.form.get("nombre", "").strip()
        if nombre:
            categoria.nombre = nombre
            db.session.commit()
            flash("✅ Categoría actualizada", "success")
            return redirect(url_for("categories"))
        else:
            flash("❌ El nombre no puede estar vacío", "danger")
    return render_template("category_edit.html", categoria=categoria)

@app.route("/category/<int:category_id>/delete", methods=["POST"])
def category_delete(category_id):
    categoria = Categoria.query.get_or_404(category_id)
    for p in categoria.productos:
        p.categorias.remove(categoria)
    db.session.delete(categoria)
    db.session.commit()
    flash("🗑️ Categoría eliminada", "success")
    return redirect(url_for("categories"))

# --------- Static uploads ----------
@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(os.path.join(BASE_DIR, app.config["UPLOAD_FOLDER"]), filename)

# --------- Public catalog ----------
@app.route("/catalog")
def catalog():
    category_id = request.args.get("categoria", type=int)
    categorias = Categoria.query.order_by(Categoria.nombre).all()
    query = Producto.query
    if category_id:
        query = query.join(Producto.categorias).filter(Categoria.id == category_id)
    q = request.args.get("q", "").strip()
    if q:
        query = query.filter(Producto.nombre.ilike(f"%{q}%"))
    productos = query.order_by(Producto.nombre).all()
    return render_template("catalog.html", productos=productos, categorias=categorias, categoria_id=category_id)

# -------------------- RUN --------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)