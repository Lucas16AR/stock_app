"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
      }}
      className="rounded-lg border border-input-border px-3 py-1.5 text-muted hover:bg-hover"
    >
      Salir
    </button>
  );
}
