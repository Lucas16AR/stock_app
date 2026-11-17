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
  // Caché: promedio ponderado de sus compras (recalcular_costos, 006).
  // No se escriben desde el admin.
  precio_compra: number;
  costo_envio_unitario: number;
  costo_extra: number;
  margen: number;
  precio_venta: number;
  // Caché: el lote de la última compra. No se edita a mano.
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
  // Costo de la gorra al venderla (lo congela registrar_venta, migración
  // 006). La ganancia se calcula con este valor, no con el costo de hoy.
  costo_unitario: number | null;
  productos?: Producto;
};

// Un ingreso de unidades de una gorra (migración 006). Los costos son por
// unidad. En un lote, el envío lo reparte la base (repartir_envio_lote);
// sin lote, se carga a mano. Se escribe solo con las funciones
// registrar_compra / actualizar_compra / anular_compra.
export type Compra = {
  id: number;
  producto_id: number;
  lote_id: number | null;
  unidades: number;
  precio_compra: number;
  costo_envio_unitario: number;
  costo_extra: number;
  ref_interna: string | null;
  fecha: string;
};
