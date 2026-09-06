import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { effectivePrice, formatPrice, productQuery } from "@/lib/store";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const title = params.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${title} — ALTAIRSTORE` },
        {
          name: "description",
          content: `${title}: specifications, pricing and availability at ALTAIRSTORE.`,
        },
        { property: "og:title", content: `${title} — ALTAIRSTORE` },
        {
          property: "og:description",
          content: `${title}: specifications, pricing and availability at ALTAIRSTORE.`,
        },
      ],
    };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { add } = useCart();
  const [active, setActive] = useState(0);
  const [choices, setChoices] = useState<Record<string, number>>({});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="px-6 py-20 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="px-6 py-20 text-center">
          <h1 className="font-serif text-xl">This piece is no longer listed</h1>
          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-full bg-obsidian px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white"
          >
            Back to collection
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const onSale = product.sale_price !== null && product.sale_price < product.price;
  const groups = (product.variants ?? []).filter((g) => g.options?.length);
  const selected = groups.map((g) => g.options[choices[g.name] ?? 0]);
  const variantImages = selected.map((o) => o?.image).filter((src): src is string => !!src);
  const images = [...variantImages, ...product.images].filter(
    (src, i, all) => all.indexOf(src) === i,
  );
  const priceDelta = selected.reduce((sum, o) => sum + (o?.price_delta ?? 0), 0);
  const unitPrice = effectivePrice(product) + priceDelta;
  const variantLabel = groups
    .map((g, i) => `${g.name}: ${selected[i]?.name ?? ""}`)
    .join(" · ");

  return (
    <div className="min-h-screen bg-background text-obsidian">
      <SiteHeader />

      <div className="px-6 pt-6">
        <Link
          to="/shop"
          className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground"
        >
          ← Collection
        </Link>

        <div className="mt-5 aspect-square w-full overflow-hidden rounded-2xl bg-mercury">
          {images[active] ? (
            <img src={images[active]} alt={product.name} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Image pending
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex gap-3">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setActive(i)}
                className={`size-16 overflow-hidden rounded-lg border ${
                  i === active ? "border-obsidian" : "border-mercury"
                }`}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          <p className="eyebrow text-gold-leaf">{product.tagline ?? product.category}</p>
          <h1 className="mt-3 font-display text-3xl leading-tight">{product.name}</h1>
          <p className="mt-4 text-lg font-semibold">
            {formatPrice(effectivePrice(product))}
            {onSale && (
              <span className="ml-3 text-sm font-normal text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {product.stock > 0 ? `${product.stock} available` : "Currently reserved"}
          </p>

          <button
            disabled={product.stock <= 0}
            onClick={() => {
              add({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: effectivePrice(product),
                image: product.images[0] ?? null,
              });
              toast.success(`${product.name} added to your bag`);
            }}
            className="mt-6 w-full rounded-full bg-obsidian py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white disabled:opacity-40"
          >
            {product.stock > 0 ? "Add to bag" : "Sold out"}
          </button>

          {product.description && (
            <div className="mt-10 space-y-4 font-serif text-lg leading-relaxed text-obsidian/75">
              {product.description.split(/\n{1,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {Object.keys(product.specs).length > 0 && (
            <dl className="mt-10 border-t border-mercury">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-6 border-b border-mercury py-4">
                  <dt className="eyebrow text-muted-foreground">{key}</dt>
                  <dd className="text-right text-sm">{String(value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
