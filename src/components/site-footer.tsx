import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="border-t border-mercury px-6 py-14 text-center">
      <img src={logo.url} alt="ALTAIRSTORE" className="mx-auto mb-6 h-14 w-14 object-contain" />
      <p className="font-display text-[10px] uppercase tracking-[0.35em]">Altair Timepieces</p>
      <div className="mt-6 flex flex-wrap justify-center gap-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        <Link to="/shop" className="hover:text-obsidian">
          Collection
        </Link>
        <Link to="/sale" className="hover:text-obsidian">
          Sale
        </Link>
        <Link to="/about" className="hover:text-obsidian">
          Maison
        </Link>
        <Link to="/auth" className="hover:text-obsidian">
          Account
        </Link>
      </div>
      <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        © {new Date().getFullYear()} ALTAIRSTORE. All rights reserved.
      </p>
    </footer>
  );
}
