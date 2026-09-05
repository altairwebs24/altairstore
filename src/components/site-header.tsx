import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { logo } from "@/lib/media";
import { useCart } from "@/lib/cart";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/sale", label: "Sale" },
  { to: "/about", label: "Maison" },
];

export function SiteHeader() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-mercury bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <button
          className="flex size-8 items-center justify-center md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <nav className="hidden items-center gap-7 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="transition-colors hover:text-obsidian"
              activeProps={{ className: "text-obsidian" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link to="/" className="flex items-center gap-3">
          <img src={logo.url} alt="ALTAIRSTORE" className="h-9 w-9 object-contain" />
          <span className="font-display text-sm tracking-[0.28em] uppercase">Altair</span>
        </Link>

        <Link to="/cart" className="relative flex size-8 items-center justify-center">
          <ShoppingBag className="size-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-obsidian text-[9px] font-semibold text-white">
              {count}
            </span>
          )}
        </Link>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-mercury px-6 py-4 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/auth"
            onClick={() => setOpen(false)}
            className="py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-leaf"
          >
            Account
          </Link>
        </nav>
      )}
    </header>
  );
}
