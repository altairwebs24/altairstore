import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { effectivePrice, formatPrice, type Product } from "@/lib/store";
import { useCart } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const onSale = product.sale_price !== null && product.sale_price < product.price;
  const discount = onSale
    ? Math.round(((product.price - (product.sale_price ?? 0)) / product.price) * 100)
    : 0;

  return (
    <article className="group flex flex-col">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden rounded-xl bg-mercury"
      >
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid size-full place-items-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Image pending
          </div>
        )}
        {onSale ? (
          <span className="absolute left-3 top-3 rounded bg-gold-leaf px-2 py-1 text-[9px] font-bold uppercase tracking-tight text-white">
            {discount}% off
          </span>
        ) : product.featured ? (
          <span className="absolute right-3 top-3 rounded bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-tight">
            New arrival
          </span>
        ) : null}
      </Link>

      <h3 className="mt-4 font-serif text-lg leading-tight">{product.name}</h3>
      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {product.tagline ?? product.category}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">
          {formatPrice(effectivePrice(product))}
          {onSale && (
            <span className="ml-2 text-[11px] font-normal text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </span>
      </div>

      {product.variants?.length ? (
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="mt-3 rounded-full bg-obsidian px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-85"
        >
          Choose options
        </Link>
      ) : (
        <button
          onClick={() => {
            add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              variantLabel: "",
              price: effectivePrice(product),
              image: product.images[0] ?? null,
            });
            toast.success(`${product.name} added to your bag`);
          }}
          className="mt-3 rounded-full bg-obsidian px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-85"
        >
          Add to bag
        </button>
      )}
    </article>
  );
}
