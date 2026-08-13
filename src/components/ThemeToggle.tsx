"use client";

function toggle() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  localStorage.setItem("theme", next ? "dark" : "light");
}

export default function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar entre modo claro y oscuro"
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-hover hover:text-foreground"
    >
      {/* Sol: se muestra en modo claro (indica "pasar a oscuro") */}
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current dark:hidden">
        <path d="M20.354 15.354A9 9 0 0 1 8.646 3.646a9.003 9.003 0 1 0 11.708 11.708Z" />
      </svg>
      {/* Luna: se muestra en modo oscuro (indica "pasar a claro") */}
      <svg viewBox="0 0 24 24" className="hidden h-5 w-5 fill-current dark:block">
        <path d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Zm0 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 2.5a1 1 0 0 1 1 1V20a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Zm7.5-6.5a1 1 0 0 1 1-1H21a1 1 0 1 1 0 2h-.5a1 1 0 0 1-1-1ZM3 12a1 1 0 0 1 1-1h.5a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm14.657-6.657a1 1 0 0 1 1.414 0l.354.354a1 1 0 0 1-1.415 1.414l-.353-.353a1 1 0 0 1 0-1.415Zm-11.314 11.314a1 1 0 0 1 1.414 0l.354.354a1 1 0 1 1-1.414 1.414l-.354-.353a1 1 0 0 1 0-1.415Zm11.314 1.768-.353-.354a1 1 0 1 1 1.414-1.414l.354.353a1 1 0 0 1-1.415 1.415ZM5.343 6.11l-.354-.353a1 1 0 1 1 1.415-1.415l.353.354a1 1 0 1 1-1.414 1.414Z" />
      </svg>
    </button>
  );
}
