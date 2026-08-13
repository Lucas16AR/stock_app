import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-2xl tracking-wide text-neutral-50">
          GORRAS<span className="text-accent">.</span>
        </Link>
      </div>
    </header>
  );
}
