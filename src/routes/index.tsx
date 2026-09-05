import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { productsQuery, salesQuery } from "@/lib/store";
import hero from "@/assets/watch-black-dial.jpg.asset.json";
import film01 from "@/assets/film-01.mp4.asset.json";
import film02 from "@/assets/film-02.mp4.asset.json";
import film03 from "@/assets/film-03.mp4.asset.json";
import boxSkeleton from "@/assets/box-skeleton.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALTAIRSTORE — Precision Reimagined" },
      {
        name: "description",
        content:
          "Curated luxury timepieces from ALTAIRSTORE: steel bracelet, emerald heritage and skeleton watches, each delivered in the signature presentation box.",
      },
      { property: "og:title", content: "ALTAIRSTORE — Precision Reimagined" },
      {
        property: "og:description",
        content: "Curated luxury timepieces, delivered in the signature ALTAIRSTORE box.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: products } = useQuery(productsQuery);
  const { data: sales } = useQuery(salesQuery);
  const featured = (products ?? []).filter((p) => p.featured).slice(0, 4);
  const activeSale = (sales ?? []).find((s) => s.active);

  return (
    <div className="min-h-screen bg-background text-obsidian">
      <SiteHeader />

      <header className="relative overflow-hidden px-6 pt-12 pb-10">
        <p className="eyebrow text-muted-foreground">Collection MMXXVI</p>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          Precision
          <br />
          <span className="italic text-gold-leaf">Reimagined</span>
        </h1>
        <p className="mt-4 max-w-[300px] font-serif text-lg text-obsidian/60">
          Curating the world's most exceptional timepieces for the modern collector.
        </p>
        <div className="relative mt-8 aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-2xl">
          <img
            src={hero.url}
            alt="Silver steel bracelet watch with a faceted bezel and graphite dial"
            className="size-full object-cover"
          />
        </div>
      </header>

      {activeSale && (
        <div className="overflow-hidden border-y border-mercury bg-obsidian py-3 text-white">
          <div className="flex w-max animate-marquee whitespace-nowrap">
            {[0, 1].map((k) => (
              <span key={k} className="flex">
                <span className="eyebrow mx-8">{activeSale.title}</span>
                <span className="eyebrow mx-8 text-gold-leaf">
                  {activeSale.discount_percent}% off selected pieces
                </span>
                <span className="eyebrow mx-8">Free insured delivery</span>
                {activeSale.coupon_code && (
                  <span className="eyebrow mx-8 text-gold-leaf">
                    Code {activeSale.coupon_code}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <section className="px-6 py-12">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl uppercase tracking-tight">Collection</h2>
          <Link
            to="/shop"
            className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold-leaf underline decoration-1 underline-offset-4"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[film01, film02, film03].map((film, i) => (
            <video
              key={film.url}
              src={film.url}
              className="aspect-[9/16] w-full rounded-xl bg-mercury object-cover"
              muted
              loop
              playsInline
              autoPlay
              preload={i === 0 ? "auto" : "metadata"}
            />
          ))}
        </div>
        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          The Altair films
        </p>
      </section>

      <section className="mx-6 my-12 overflow-hidden rounded-3xl bg-obsidian text-white">
        <img
          src={boxSkeleton.url}
          alt="Skeleton watch presented in the ALTAIRSTORE box"
          className="aspect-square w-full object-cover"
        />
        <div className="p-8">
          <p className="eyebrow text-gold-leaf">The presentation box</p>
          <h2 className="mt-3 font-display text-2xl">Delivered as it should be</h2>
          <p className="mt-3 font-serif text-white/70">
            Every piece leaves the atelier seated in the embossed ALTAIRSTORE case, wrapped and
            insured for its journey.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-obsidian"
          >
            Explore the collection
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
