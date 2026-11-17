// "2 compras" al lado de la ref. en los listados, cuando una gorra se
// compró más de una vez (su costo es el promedio de esas compras).
export default function ChipCompras({ compras }: { compras: number }) {
  if (compras <= 1) return null;
  return (
    <span className="shrink-0 rounded-full bg-hover px-1.5 text-[11px] font-semibold text-foreground ring-1 ring-border">
      {compras} compras
    </span>
  );
}
