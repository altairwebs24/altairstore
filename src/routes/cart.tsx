import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — ALTAIRSTORE" },
      {
        name: "description",
        content: "Review your selected ALTAIRSTORE timepieces and complete your order.",
      },
      { property: "og:title", content: "Your Bag — ALTAIRSTORE" },
      { property: "og:description", content: "Review your selection and complete your order." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, setQuantity, remove, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
    notes: "",
  });

  const field =
    "mt-1 w-full rounded-lg border border-mercury bg-background px-3 py-2.5 text-sm outline-none focus:border-obsidian";

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return;
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({ ...form, total: subtotal, status: "pending" })
        .select("id")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.productId,
          product_name: l.variantLabel ? `${l.name} (${l.variantLabel})` : l.name,
          unit_price: l.price,
          quantity: l.quantity,
        })),
      );
      if (itemsError) throw itemsError;

      clear();
      toast.success("Order received — we'll email you shortly to confirm.");
      void navigate({ to: "/shop" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place the order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-obsidian">
      <SiteHeader />

      <div className="px-6 pt-10">
        <h1 className="font-display text-3xl uppercase tracking-tight">Your Bag</h1>
      </div>

      {lines.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="font-serif text-lg text-obsidian/60">Your bag is empty.</p>
          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-full bg-obsidian px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white"
          >
            Browse the collection
          </Link>
        </div>
      ) : (
        <div className="px-6 py-8">
          <div className="space-y-5">
            {lines.map((line) => (
              <div key={line.id} className="flex gap-4 border-b border-mercury pb-5">
                <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-mercury">
                  {line.image && <img src={line.image} alt="" className="size-full object-cover" />}
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-base">{line.name}</h2>
                  {line.variantLabel && (
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {line.variantLabel}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-semibold">{formatPrice(line.price)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(line.id, line.quantity - 1)}
                      className="size-7 rounded-full border border-mercury text-sm"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="text-sm">{line.quantity}</span>
                    <button
                      onClick={() => setQuantity(line.id, line.quantity + 1)}
                      className="size-7 rounded-full border border-mercury text-sm"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button
                      onClick={() => remove(line.id)}
                      className="ml-auto text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="eyebrow text-muted-foreground">Subtotal</span>
            <span className="text-lg font-semibold">{formatPrice(subtotal)}</span>
          </div>

          <form onSubmit={placeOrder} className="mt-10 space-y-4">
            <h2 className="font-display text-lg uppercase tracking-tight">Delivery details</h2>
            <label className="block">
              <span className="eyebrow text-muted-foreground">Full name</span>
              <input
                required
                className={field}
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground">Email</span>
              <input
                required
                type="email"
                className={field}
                value={form.customer_email}
                onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground">Phone</span>
              <input
                className={field}
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground">Delivery address</span>
              <textarea
                required
                rows={3}
                className={field}
                value={form.shipping_address}
                onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground">Notes (optional)</span>
              <textarea
                rows={2}
                className={field}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-obsidian py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white disabled:opacity-50"
            >
              {submitting ? "Placing order…" : `Place order — ${formatPrice(subtotal)}`}
            </button>
            <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              We confirm payment and delivery by email
            </p>
          </form>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
