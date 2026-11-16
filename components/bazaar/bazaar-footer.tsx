import Link from "next/link";

export function BazaarFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface)]/60">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 text-sm text-[var(--color-muted)] md:flex-row md:items-center md:justify-between md:px-9">
        <p>© {new Date().getFullYear()} Bazaarly. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/shop" className="hover:text-[var(--color-foreground)]">Shop</Link>
          <Link href="/account" className="hover:text-[var(--color-foreground)]">Account</Link>
          <Link href="/help" className="hover:text-[var(--color-foreground)]">Help</Link>
        </div>
      </div>
    </footer>
  );
}
