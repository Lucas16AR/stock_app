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
            className="h-9 w-auto"
            priority
          />
          <span className="font-display text-2xl tracking-wide text-foreground">
            INDY CAPS
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
