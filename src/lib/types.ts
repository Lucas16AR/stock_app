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
  precio_venta: number;
  lote_id: number | null;
  // Referencia de compra (ej. "AFA 12"). Solo admin: anon no la puede leer.
  ref_interna: string | null;
  visible_publico: boolean;
  fecha_creacion: string;
  fotos_producto?: FotoProducto[];
  categorias?: Categoria[];
};

// Lo que el showroom puede leer de un producto: solo las columnas que el
// rol anon tiene permitidas (COLUMNAS_PUBLICAS en src/lib/catalogo.ts).
// Usar este tipo en el showroom hace que el compilador avise si una
// página pública intenta usar un costo, el margen o la ref. interna.
export type ProductoPublico = Pick<
  Producto,
  "id" | "nombre" | "descripcion" | "cantidad" | "precio_venta" | "visible_publico" | "fecha_creacion"
> & {
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
