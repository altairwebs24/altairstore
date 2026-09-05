import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { productsQuery, salesQuery } from "@/lib/store";

export const Route = createFileRoute("/sale")({
  head: () => ({
    meta: [
      { title: "Sale & Archive Event — ALTAIRSTORE" },
      {
        name: "description",
        content:
          "Reduced ALTAIRSTORE timepieces and current sale campaigns, available while stock lasts.",
      },
      { property: "og:title", content: "Sale & Archive Event — ALTAIRSTORE" },
      {
        property: "og:description",
        content: "Reduced ALTAIRSTORE timepieces, available while stock lasts.",
      },
    ],
  }),
  component: SalePage,
});

function SalePage() {
  const { data: products } = useQuery(productsQuery);
  const { data: sales } = useQuery(salesQuery);
  const reduced = (products ?? []).filter((p) => p.sale_price !== null && p.sale_price < p.price);
  const active = (sales ?? []).filter((s) => s.active);

  return (
    <div className="min-h-screen bg-background text-obsidian">
      <SiteHeader />

      <div className="px-6 pt-10">
        <p className="eyebrow text-gold-leaf">Limited period</p>
        <h1 className="mt-3 font-display text-3xl uppercase tracking-tight">Sale</h1>
      </div>

      {active.length > 0 && (
        <div className="mx-6 mt-8 space-y-3">
          {active.map((s) => (
            <div key={s.id} className="rounded-2xl bg-obsidian p-6 text-white">
              <p className="eyebrow text-gold-leaf">{s.discount_percent}% off</p>
              <h2 className="mt-2 font-serif text-xl">{s.title}</h2>
              {s.description && <p className="mt-2 text-sm text-white/70">{s.description}</p>}
              {s.coupon_code && (
                <p className="mt-4 inline-block rounded border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em]">
                  Code {s.coupon_code}
                </p>
              )}
              {s.ends_at && (
                <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Ends {new Date(s.ends_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <section className="px-6 py-10">
        {reduced.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reduced pieces at the moment.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10">
            {reduced.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
