from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory
from models import db, Lote, Producto, Venta, FotoProducto
import os
from werkzeug.utils import secure_filename

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join("static", "uploads")
ALLOWED_EXT = {"png","jpg","jpeg","gif"}

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(BASE_DIR, "stock.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.secret_key = "supersecreto"

db.init_app(app)

with app.app_context():
    os.makedirs(os.path.join(BASE_DIR, UPLOAD_FOLDER), exist_ok=True)
    db.create_all()

def allowed_file(filename):
    return "." in filename and filename.rsplit(".",1)[1].lower() in ALLOWED_EXT

@app.route("/dashboard")
def dashboard():
    total_ventas = db.session.query(db.func.sum(Venta.cantidad)).scalar() or 0
    total_stock = db.session.query(db.func.sum(Producto.cantidad)).scalar() or 0
    total_lotes = Lote.query.count()
    ganancias = 0
    for v in Venta.query.all():
        if v.producto:
            ganancias += (v.precio_venta - (v.producto.precio_compra or 0)) * v.cantidad
    ganancia_estimada = round(ganancias,2)

    meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
    ventas_mensuales = [0]*12
    for v in Venta.query.all():
        ventas_mensuales[v.fecha.month-1] += v.cantidad

    productos_stock = Producto.query.order_by(Producto.cantidad.desc()).limit(6).all()

    return render_template("dashboard.html",
                           total_ventas=total_ventas,
                           total_stock=total_stock,
                           total_lotes=total_lotes,
                           ganancia_estimada=ganancia_estimada,
                           meses=meses,
                           ventas_mensuales=ventas_mensuales,
                           productos_stock=productos_stock)

@app.route("/")
def index():
    return redirect(url_for("dashboard"))

# ---------- LOTES ----------
@app.route("/lotes")
def lotes():
    lotes = Lote.query.order_by(Lote.fecha.desc()).all()
    return render_template("lotes.html", lotes=lotes)

@app.route("/lote/nuevo", methods=["GET","POST"])
def add_lote():
    if request.method == "POST":
        try:
            costo_envio = float(request.form.get("costo_envio",0) or 0)
        except ValueError:
            costo_envio = 0.0
        lote = Lote(costo_envio=costo_envio)
        db.session.add(lote)
        db.session.commit()
        flash("Lote creado", "success")
        return redirect(url_for("lotes"))
    return render_template("add_lote.html")

@app.route("/lote/<int:lote_id>/eliminar", methods=["POST"])
def delete_lote(lote_id):
    lote = Lote.query.get_or_404(lote_id)
    for p in lote.productos:
        for f in list(p.fotos):
            try:
                path = os.path.join(BASE_DIR, app.config["UPLOAD_FOLDER"], f.ruta)
                if os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass
            db.session.delete(f)
        db.session.delete(p)
    db.session.delete(lote)
    db.session.commit()
    flash("Lote y productos eliminados", "success")
    return redirect(url_for("lotes"))

# ---------- PRODUCTOS ----------
@app.route("/productos")
def productos():
    productos = Producto.query.order_by(Producto.nombre).all()
    return render_template("productos.html", productos=productos)

@app.route("/producto/nuevo", methods=["GET","POST"])
def nuevo_producto():
    lotes = Lote.query.all()
    if request.method == "POST":
        nombre = request.form.get("nombre","").strip()
        cantidad = int(request.form.get("cantidad",0) or 0)
        precio_compra = float(request.form.get("precio_compra",0) or 0)
        costo_envio_unitario = float(request.form.get("costo_envio_unitario",0) or 0)
        costo_extra = float(request.form.get("costo_extra",0) or 0)
        margen = float(request.form.get("margen",0.5) or 0.5)
        lote_id = request.form.get("lote_id") or None

        producto = Producto(
            nombre=nombre,
            cantidad=cantidad,
            precio_compra=precio_compra,
            costo_envio_unitario=costo_envio_unitario,
            costo_extra=costo_extra,
            margen=margen,
            lote_id=lote_id
        )
        producto.precio_sugerido = producto.calcular_precio_sugerido()
        db.session.add(producto)
        db.session.commit()

        files = request.files.getlist("fotos")
        if len(files) > 4:
            flash("Solo se permiten hasta 4 fotos", "error")
        else:
            for file in files[:4]:
                if file and file.filename and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                    base, ext = os.path.splitext(filename)
                    counter = 1
                    while os.path.exists(os.path.join(BASE_DIR, filepath)):
                        filename = f"{base}_{counter}{ext}"
                        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                        counter += 1
                    file.save(os.path.join(BASE_DIR, filepath))
                    foto = FotoProducto(ruta=filename, producto_id=producto.id)
                    db.session.add(foto)
            db.session.commit()
        flash(f"Producto '{producto.nombre}' agregado", "success")
        return redirect(url_for("productos"))
    return render_template("nuevo_producto.html", lotes=lotes)

@app.route("/lote/<int:lote_id>/producto", methods=["GET","POST"])
def add_product(lote_id):
    lote = Lote.query.get_or_404(lote_id)
    if request.method == "POST":
        nombre = request.form.get("nombre","").strip()
        cantidad = int(request.form.get("cantidad",0) or 0)
        precio_compra = float(request.form.get("precio_compra",0) or 0)
        costo_envio_unitario = float(request.form.get("costo_envio_unitario",0) or 0)
        costo_extra = float(request.form.get("costo_extra",0) or 0)
        margen = float(request.form.get("margen",0.5) or 0.5)

        producto = Producto(
            nombre=nombre,
            cantidad=cantidad,
            precio_compra=precio_compra,
            costo_envio_unitario=costo_envio_unitario,
            costo_extra=costo_extra,
            margen=margen,
            lote_id=lote.id
        )
        producto.precio_sugerido = producto.calcular_precio_sugerido()
        db.session.add(producto)
        db.session.commit()

        files = request.files.getlist("fotos")
        if len(files) > 4:
            flash("Solo se permiten hasta 4 fotos", "error")
        else:
            for file in files[:4]:
                if file and file.filename and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                    base, ext = os.path.splitext(filename)
                    counter = 1
                    while os.path.exists(os.path.join(BASE_DIR, filepath)):
                        filename = f"{base}_{counter}{ext}"
                        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                        counter += 1
                    file.save(os.path.join(BASE_DIR, filepath))
                    foto = FotoProducto(ruta=filename, producto_id=producto.id)
                    db.session.add(foto)
            db.session.commit()
        flash(f"Producto agregado al lote {lote.id}", "success")
        return redirect(url_for("lotes"))
    return render_template("add_product.html", lote=lote)

@app.route("/producto/<int:producto_id>")
def ver_producto(producto_id):
    producto = Producto.query.get_or_404(producto_id)
    return render_template("producto_detail.html", producto=producto)

@app.route("/producto/<int:producto_id>/editar", methods=["GET","POST"])
def editar_producto(producto_id):
    producto = Producto.query.get_or_404(producto_id)
    lotes = Lote.query.all()
    if request.method == "POST":
        producto.nombre = request.form.get("nombre","").strip()
        producto.cantidad = int(request.form.get("cantidad",0) or 0)
        producto.precio_compra = float(request.form.get("precio_compra",0) or 0)
        producto.costo_envio_unitario = float(request.form.get("costo_envio_unitario",0) or 0)
        producto.costo_extra = float(request.form.get("costo_extra",0) or 0)
        producto.margen = float(request.form.get("margen",0.5) or 0.5)
        producto.lote_id = request.form.get("lote_id") or None
        producto.precio_sugerido = producto.calcular_precio_sugerido()
        db.session.commit()

        files = request.files.getlist("fotos")
        remaining = 4 - len(producto.fotos)
        for file in files[:remaining]:
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                base, ext = os.path.splitext(filename)
                counter = 1
                while os.path.exists(os.path.join(BASE_DIR, filepath)):
                    filename = f"{base}_{counter}{ext}"
                    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                    counter += 1
                file.save(os.path.join(BASE_DIR, filepath))
                foto = FotoProducto(ruta=filename, producto_id=producto.id)
                db.session.add(foto)
        db.session.commit()
        flash("Producto actualizado", "success")
        return redirect(url_for("productos"))
    return render_template("editar_producto.html", producto=producto, lotes=lotes)

@app.route("/producto/<int:producto_id>/eliminar", methods=["POST"])
def eliminar_producto(producto_id):
    producto = Producto.query.get_or_404(producto_id)
    for f in list(producto.fotos):
        path = os.path.join(BASE_DIR, app.config["UPLOAD_FOLDER"], f.ruta)
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception:
            pass
        db.session.delete(f)
    db.session.delete(producto)
    db.session.commit()
    flash("Producto y fotos eliminados", "success")
    return redirect(url_for("productos"))

@app.route("/foto/<int:foto_id>/eliminar", methods=["POST"])
def eliminar_foto(foto_id):
    foto = FotoProducto.query.get_or_404(foto_id)
    producto_id = foto.producto_id
    path = os.path.join(BASE_DIR, app.config["UPLOAD_FOLDER"], foto.ruta)
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass
    db.session.delete(foto)
    db.session.commit()
    flash("Foto eliminada", "success")
    return redirect(url_for("editar_producto", producto_id=producto_id))

# ---------- VENTAS ----------
@app.route("/venta", methods=["GET","POST"])
def ventas():
    productos = Producto.query.filter(Producto.cantidad>0).all()
    if request.method == "POST":
        producto_id = int(request.form.get("producto_id"))
        cantidad = int(request.form.get("cantidad",0) or 0)
        precio_venta = float(request.form.get("precio_venta",0) or 0)
        producto = Producto.query.get(producto_id)
        if not producto:
            flash("Producto no encontrado", "error")
            return redirect(url_for("ventas"))
        if cantidad > producto.cantidad:
            flash(f"No hay suficiente stock. Disponible: {producto.cantidad}", "error")
            return redirect(url_for("ventas"))
        producto.cantidad -= cantidad
        venta = Venta(producto_id=producto.id, cantidad=cantidad, precio_venta=precio_venta)
        db.session.add(venta)
        db.session.commit()
        flash("Venta registrada", "success")
        return redirect(url_for("ventas"))
    ventas = Venta.query.order_by(Venta.fecha.desc()).all()
    return render_template("ventas.html", productos=productos, ventas=ventas)

# ---------- STOCK ----------
@app.route("/stock")
def stock():
    productos = Producto.query.order_by(Producto.nombre).all()
    return render_template("stock.html", productos=productos)

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(os.path.join(BASE_DIR, app.config['UPLOAD_FOLDER']), filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)