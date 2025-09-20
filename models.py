from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Tabla intermedia muchos-a-muchos
producto_categoria = db.Table(
    "producto_categoria",
    db.Column("producto_id", db.Integer, db.ForeignKey("producto.id"), primary_key=True),
    db.Column("categoria_id", db.Integer, db.ForeignKey("categoria.id"), primary_key=True),
)


class Lote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    costo_envio = db.Column(db.Float, nullable=False, default=0.0)

    productos = db.relationship("Producto", back_populates="lote", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Lote {self.id} - {self.fecha.strftime('%Y-%m-%d')}>"


class Categoria(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)

    productos = db.relationship(
        "Producto",
        secondary=producto_categoria,
        back_populates="categorias"
    )

    def __repr__(self):
        return f"<Categoria {self.nombre}>"


class Producto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)
    cantidad = db.Column(db.Integer, default=0)
    precio_compra = db.Column(db.Float, nullable=False, default=0.0)
    costo_envio_unitario = db.Column(db.Float, default=0.0)
    costo_extra = db.Column(db.Float, default=0.0)
    margen = db.Column(db.Float, default=0.5)
    lote_id = db.Column(db.Integer, db.ForeignKey("lote.id"), nullable=True)

    lote = db.relationship("Lote", back_populates="productos")
    fotos = db.relationship("FotoProducto", back_populates="producto", cascade="all, delete-orphan")
    ventas = db.relationship("Venta", back_populates="producto")

    categorias = db.relationship(
        "Categoria",
        secondary=producto_categoria,
        back_populates="productos"
    )

    @property
    def precio_sugerido(self):
        """Calcula siempre el precio sugerido en base a costos + margen."""
        costo_total = (self.precio_compra or 0) + (self.costo_envio_unitario or 0) + (self.costo_extra or 0)
        return round(costo_total * (1 + (self.margen or 0)), 2)

    def add_foto(self, foto):
        """Agrega una foto si el producto tiene menos de 4."""
        if len(self.fotos) >= 4:
            raise ValueError("Un producto no puede tener más de 4 fotos")
        self.fotos.append(foto)

    def __repr__(self):
        return f"<Producto {self.nombre} (Stock: {self.cantidad})>"


class FotoProducto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ruta = db.Column(db.String(300), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("producto.id"), nullable=False)

    producto = db.relationship("Producto", back_populates="fotos")

    def __repr__(self):
        return f"<Foto {self.ruta}>"


class Venta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    producto_id = db.Column(db.Integer, db.ForeignKey("producto.id"), nullable=False)  # 🔒 siempre debe tener producto
    cantidad = db.Column(db.Integer, nullable=False)
    precio_venta = db.Column(db.Float, nullable=False)

    producto = db.relationship("Producto", back_populates="ventas")

    def __repr__(self):
        return f"<Venta {self.id} - Producto {self.producto_id} - Cantidad {self.cantidad}>"