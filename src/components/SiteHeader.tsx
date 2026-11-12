import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/mark.png"
            alt="Indy Caps"
            width={48}
            height={29}
            className="h-9 w-auto rounded-md"
            priority
          />
          <span className="font-display text-2xl tracking-wide text-foreground">
            INDY CAPS
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/admin"
            aria-label="Panel admin"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-hover hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 5a3 3 0 1 1 6 0v3H9Zm3 7a2 2 0 0 1 1 3.732V20a1 1 0 1 1-2 0v-2.268A2 2 0 0 1 12 14Z" />
            </svg>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
