import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

// Lo llama el cron de Vercel (ver vercel.json) una vez por día.
// El plan gratis de Supabase pausa el proyecto tras ~7 días sin actividad,
// y cuando eso pasa el showroom queda vacío sin mostrar ningún error.
// Una consulta liviana a la base alcanza para que cuente como actividad.
export async function GET(request: Request) {
  // Si CRON_SECRET está configurado en Vercel, Vercel lo manda solo en el
  // header Authorization al disparar el cron; rechazamos cualquier otra
  // llamada. Sin la variable el endpoint queda abierto, pero solo lee la
  // cantidad de categorías (que ya es pública).
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("No autorizado", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await supabase
    .from("categorias")
    .select("id", { count: "exact", head: true });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, fecha: new Date().toISOString() });
}
