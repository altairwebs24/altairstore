import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { productsQuery } from "@/lib/store";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "The Collection — ALTAIRSTORE" },
      {
        name: "description",
        content:
          "Browse every ALTAIRSTORE timepiece: steel bracelet quartz, emerald heritage, skeleton automatics and slim dress watches.",
      },
      { property: "og:title", content: "The Collection — ALTAIRSTORE" },
      {
        property: "og:description",
        content: "Every ALTAIRSTORE timepiece, from steel bracelet quartz to skeleton automatics.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { data: products, isLoading } = useQuery(productsQuery);
  const [category, setCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set((products ?? []).map((p) => p.category)))];
  const visible = (products ?? []).filter((p) => category === "All" || p.category === category);

  return (
    <div className="min-h-screen bg-background text-obsidian">
      <SiteHeader />

      <div className="px-6 pt-10">
        <p className="eyebrow text-muted-foreground">Every piece</p>
        <h1 className="mt-3 font-display text-3xl uppercase tracking-tight">The Collection</h1>

        <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                category === c
                  ? "border-obsidian bg-obsidian text-white"
                  : "border-mercury text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <section className="px-6 py-10">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading the collection…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
