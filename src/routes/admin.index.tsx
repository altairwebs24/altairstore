import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  allProductsQuery,
  effectivePrice,
  formatPrice,
  ordersQuery,
  salesQuery,
  type Product,
} from "@/lib/store";
import { ProductEditor } from "@/components/admin/product-editor";
import { adminField, GhostButton, Label, Panel, PrimaryButton } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Tab = "catalogue" | "add" | "sales" | "orders";

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("catalogue");
  const [editing, setEditing] = useState<Product | null>(null);
  const products = useQuery(allProductsQuery);
  const sales = useQuery(salesQuery);
  const orders = useQuery(ordersQuery);
  const queryClient = useQueryClient();

  const revenue = (orders.data ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "catalogue", label: "Catalogue" },
    { id: "add", label: editing ? "Edit" : "Add product" },
    { id: "sales", label: "Sales" },
    { id: "orders", label: "Orders" },
  ];

  return (
    <div className="px-5 py-6 pb-20">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Products", value: String(products.data?.length ?? 0) },
          { label: "Orders", value: String(orders.data?.length ?? 0) },
          { label: "Revenue", value: formatPrice(revenue) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {stat.label}
            </p>
            <p className="mt-1 font-display text-lg">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id !== "add") setEditing(null);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${
              tab === t.id ? "bg-white text-obsidian" : "border border-white/20 text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {tab === "catalogue" && (
          <Panel title="Catalogue">
            {products.isLoading ? (
              <p className="text-xs text-white/50">Loading…</p>
            ) : (
              <div className="space-y-3">
                {(products.data ?? []).map((product) => (
                  <div key={product.id} className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-white/10">
                      {product.images[0] && (
                        <img src={product.images[0]} alt="" className="size-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-sm">{product.name}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-white/40">
                        {formatPrice(effectivePrice(product))} · {product.stock} in stock ·{" "}
                        {product.published ? "live" : "hidden"}
                        {product.featured ? " · homepage" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditing(product);
                        setTab("add");
                      }}
                      className="rounded-full border border-white/20 p-2"
                      aria-label="Edit product"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Delete ${product.name}?`)) return;
                        const { error } = await supabase
                          .from("products")
                          .delete()
                          .eq("id", product.id);
                        if (error) {
                          toast.error(error.message);
                          return;
                        }
                        await queryClient.invalidateQueries({ queryKey: ["products"] });
                        toast.success("Product removed");
                      }}
                      className="rounded-full border border-white/20 p-2"
                      aria-label="Delete product"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                {products.data?.length === 0 && (
                  <p className="text-xs text-white/50">No products yet.</p>
                )}
              </div>
            )}
          </Panel>
        )}

        {tab === "add" && (
          <ProductEditor
            key={editing?.id ?? "new"}
            editing={editing}
            onDone={() => {
              setEditing(null);
              setTab("catalogue");
            }}
          />
        )}

        {tab === "sales" && <SalesManager />}

        {tab === "orders" && (
          <Panel title="Orders">
            {orders.isLoading ? (
              <p className="text-xs text-white/50">Loading…</p>
            ) : (
              <div className="space-y-3">
                {(orders.data ?? []).map((order) => (
                  <div key={order.id} className="border-b border-white/10 pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-serif text-sm">{order.customer_name}</p>
                      <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/40">
                      {order.customer_email} · {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-xs text-white/60">{order.shipping_address}</p>
                    <div className="mt-2 flex gap-2">
                      {["pending", "paid", "shipped", "cancelled"].map((status) => (
                        <button
                          key={status}
                          onClick={async () => {
                            const { error } = await supabase
                              .from("orders")
                              .update({ status })
                              .eq("id", order.id);
                            if (error) {
                              toast.error(error.message);
                              return;
                            }
                            await queryClient.invalidateQueries({ queryKey: ["orders"] });
                          }}
                          className={`rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] ${
                            order.status === status
                              ? "bg-gold-leaf text-obsidian"
                              : "border border-white/20 text-white/60"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {orders.data?.length === 0 && <p className="text-xs text-white/50">No orders yet.</p>}
              </div>
            )}
          </Panel>
        )}
      </div>

      {sales.error && <p className="mt-4 text-xs text-destructive">{sales.error.message}</p>}
    </div>
  );
}

function SalesManager() {
  const sales = useQuery(salesQuery);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    discount_percent: "10",
    coupon_code: "",
    ends_at: "",
  });
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!draft.title.trim()) {
      toast.error("Give the campaign a name");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("sales").insert({
      title: draft.title.trim(),
      description: draft.description || null,
      discount_percent: Number(draft.discount_percent) || 0,
      coupon_code: draft.coupon_code.trim().toUpperCase() || null,
      ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
      active: true,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft({ title: "", description: "", discount_percent: "10", coupon_code: "", ends_at: "" });
    await queryClient.invalidateQueries({ queryKey: ["sales"] });
    toast.success("Campaign live");
  };

  return (
    <div className="space-y-4">
      <Panel title="Run a sale">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <Label>Campaign name</Label>
            <input
              className={adminField}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <Label>Description</Label>
            <textarea
              rows={2}
              className={adminField}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </label>
          <label className="block">
            <Label>Discount %</Label>
            <input
              type="number"
              min="1"
              max="90"
              className={adminField}
              value={draft.discount_percent}
              onChange={(e) => setDraft({ ...draft, discount_percent: e.target.value })}
            />
          </label>
          <label className="block">
            <Label>Coupon code</Label>
            <input
              className={adminField}
              value={draft.coupon_code}
              onChange={(e) => setDraft({ ...draft, coupon_code: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <Label>Ends on</Label>
            <input
              type="date"
              className={adminField}
              value={draft.ends_at}
              onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-5">
          <PrimaryButton onClick={create} disabled={busy}>
            {busy ? "Starting…" : "Start campaign"}
          </PrimaryButton>
        </div>
      </Panel>

      <Panel title="Campaigns">
        <div className="space-y-3">
          {(sales.data ?? []).map((sale) => (
            <div key={sale.id} className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-sm">{sale.title}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-white/40">
                  {sale.discount_percent}% off
                  {sale.coupon_code ? ` · ${sale.coupon_code}` : ""} ·{" "}
                  {sale.active ? "active" : "paused"}
                </p>
              </div>
              <GhostButton
                onClick={async () => {
                  const { error } = await supabase
                    .from("sales")
                    .update({ active: !sale.active })
                    .eq("id", sale.id);
                  if (error) {
                    toast.error(error.message);
                    return;
                  }
                  await queryClient.invalidateQueries({ queryKey: ["sales"] });
                }}
              >
                {sale.active ? "Pause" : "Resume"}
              </GhostButton>
              <button
                onClick={async () => {
                  if (!window.confirm(`Delete ${sale.title}?`)) return;
                  const { error } = await supabase.from("sales").delete().eq("id", sale.id);
                  if (error) {
                    toast.error(error.message);
                    return;
                  }
                  await queryClient.invalidateQueries({ queryKey: ["sales"] });
                }}
                className="rounded-full border border-white/20 p-2"
                aria-label="Delete campaign"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {sales.data?.length === 0 && <p className="text-xs text-white/50">No campaigns yet.</p>}
        </div>
      </Panel>
    </div>
  );
}
