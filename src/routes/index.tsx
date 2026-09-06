import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { productsQuery, salesQuery } from "@/lib/store";
import {
  watchBlackDial as hero,
  film01,
  film02,
  film03,
  boxSkeleton,
} from "@/lib/media";

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

      <section className="px-6 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow text-muted-foreground">The Altair films</p>
            <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">In motion</h2>
          </div>
        </div>

        {/* Feature film */}
        <div className="relative overflow-hidden rounded-2xl bg-mercury">
          <video
            src={film01.url}
            className="aspect-[4/5] w-full object-cover sm:aspect-[16/9]"
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/80 to-transparent p-6 pt-16 text-white sm:p-8 sm:pt-24">
            <p className="eyebrow text-gold-leaf">Chapter I</p>
            <p className="mt-2 font-serif text-lg italic">Where the light catches the steel.</p>
          </div>
        </div>

        {/* Two smaller films with captions */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 overflow-hidden rounded-2xl border border-mercury bg-background p-3">
            <video
              src={film02.url}
              className="aspect-[9/16] w-28 shrink-0 rounded-xl bg-mercury object-cover sm:w-36"
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
            />
            <div className="py-2 pr-2">
              <p className="eyebrow text-gold-leaf">Chapter II</p>
              <p className="mt-2 font-serif text-base leading-snug text-obsidian/80">
                The crown, the case, the quiet confidence of detail.
              </p>
            </div>
          </div>

          <div className="flex flex-row-reverse items-center gap-4 overflow-hidden rounded-2xl border border-mercury bg-background p-3 sm:flex-row">
            <video
              src={film03.url}
              className="aspect-[9/16] w-28 shrink-0 rounded-xl bg-mercury object-cover sm:w-36"
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
            />
            <div className="py-2 pl-2 sm:pl-0 sm:pr-2">
              <p className="eyebrow text-gold-leaf">Chapter III</p>
              <p className="mt-2 font-serif text-base leading-snug text-obsidian/80">
                Built to be worn, made to be remembered.
              </p>
            </div>
          </div>
        </div>
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
