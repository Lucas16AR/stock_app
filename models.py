from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Lote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, default=datetime.now)
    costo_envio = db.Column(db.Float, nullable=False, default=0.0)
    productos = db.relationship("Producto", back_populates="lote", cascade="all, delete-orphan")

class Producto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)
    cantidad = db.Column(db.Integer, default=0)
    precio_compra = db.Column(db.Float, nullable=False, default=0.0)
    costo_envio_unitario = db.Column(db.Float, default=0.0)
    costo_extra = db.Column(db.Float, default=0.0)
    margen = db.Column(db.Float, default=0.5)  # 0.5 = 50%
    precio_sugerido = db.Column(db.Float, default=0.0)
    lote_id = db.Column(db.Integer, db.ForeignKey("lote.id"), nullable=True)

    lote = db.relationship("Lote", back_populates="productos")
    fotos = db.relationship("FotoProducto", back_populates="producto", cascade="all, delete-orphan")
    ventas = db.relationship("Venta", back_populates="producto")

    def calcular_precio_sugerido(self):
        costo_total = (self.precio_compra or 0) + (self.costo_envio_unitario or 0) + (self.costo_extra or 0)
        return round(costo_total * (1 + (self.margen or 0)), 2)

class FotoProducto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ruta = db.Column(db.String(300), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("producto.id"), nullable=False)
    producto = db.relationship("Producto", back_populates="fotos")

class Venta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    producto_id = db.Column(db.Integer, db.ForeignKey("producto.id"), nullable=True)  # puede ser NULL si se elimina producto
    cantidad = db.Column(db.Integer, nullable=False)
    precio_venta = db.Column(db.Float, nullable=False)

    producto = db.relationship("Producto", back_populates="ventas")
