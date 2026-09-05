import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { boxSkeletonDesk as boxDesk, boxSilverSlim as slim } from "@/lib/media";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "The Maison — ALTAIRSTORE" },
      {
        name: "description",
        content:
          "How ALTAIRSTORE selects, inspects and presents each timepiece, and what to expect from delivery and aftercare.",
      },
      { property: "og:title", content: "The Maison — ALTAIRSTORE" },
      {
        property: "og:description",
        content: "How ALTAIRSTORE selects, inspects and presents each timepiece.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background text-obsidian">
      <SiteHeader />

      <div className="px-6 pt-10">
        <p className="eyebrow text-muted-foreground">Since MMXXVI</p>
        <h1 className="mt-3 font-display text-3xl uppercase tracking-tight">The Maison</h1>
        <p className="mt-5 max-w-prose font-serif text-lg text-obsidian/70">
          ALTAIRSTORE exists for one reason: to put considered timepieces on wrists without the
          theatre of a traditional boutique. Every reference is selected by hand, inspected for
          finishing and timekeeping, then boxed in the embossed Altair case.
        </p>
      </div>

      <div className="mt-10 grid gap-4 px-6 sm:grid-cols-2">
        <img
          src={boxDesk.url}
          alt="Skeleton watch in the ALTAIRSTORE presentation box on a desk"
          className="aspect-square w-full rounded-2xl object-cover"
        />
        <img
          src={slim.url}
          alt="Slim silver dial watch in the ALTAIRSTORE presentation box"
          className="aspect-square w-full rounded-2xl object-cover"
        />
      </div>

      <section className="px-6 py-12">
        <div className="space-y-8">
          {[
            {
              title: "Selection",
              body: "Each reference is chosen for dial finishing, case geometry and bracelet comfort — never for logo alone.",
            },
            {
              title: "Inspection",
              body: "Movements are timed and cases are checked for alignment before a piece is listed as available.",
            },
            {
              title: "Presentation",
              body: "Watches ship in the embossed Altair box with a spare link set and insured tracking.",
            },
            {
              title: "Aftercare",
              body: "Written to us within twelve months and we will arrange servicing guidance for your reference.",
            },
          ].map((item) => (
            <div key={item.title} className="border-t border-mercury pt-5">
              <h2 className="eyebrow text-gold-leaf">{item.title}</h2>
              <p className="mt-2 font-serif text-lg text-obsidian/70">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
