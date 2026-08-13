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
      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:bg-neutral-800"
    >
      Salir
    </button>
  );
}
