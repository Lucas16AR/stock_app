// Estos valores son públicos por diseño: la URL del proyecto y la anon key
// de Supabase están protegidas por Row Level Security, no por secreto.
// Se pueden sobreescribir con variables de entorno si hace falta rotarlas.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kkhwuifybqfgavumwmwv.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_hXlQAnu9kRlb7AaD9PUq1Q_fHlFFbm4";

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5492604647804";
