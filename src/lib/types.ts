export type Categoria = {
  id: number;
  nombre: string;
};

export type FotoProducto = {
  id: number;
  producto_id: number;
  path: string;
  orden: number;
};

export type Lote = {
  id: number;
  fecha: string;
  costo_envio: number;
  nota: string | null;
};

export type Producto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  cantidad: number;
  precio_compra: number;
  costo_envio_unitario: number;
  costo_extra: number;
  margen: number;
  lote_id: number | null;
  visible_publico: boolean;
  fecha_creacion: string;
  fotos_producto?: FotoProducto[];
  categorias?: Categoria[];
};

export type Venta = {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_venta: number;
  fecha: string;
  productos?: Producto;
};
