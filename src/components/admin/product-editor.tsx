import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { slugify, uploadStoreImage, type Product, type VariantGroup } from "@/lib/store";
import { enhanceDescription, importFromLink } from "@/lib/ai.functions";
import { adminField, GhostButton, GoldButton, Label, Panel, PrimaryButton } from "./ui";

type Draft = {
  name: string;
  tagline: string;
  description: string;
  price: string;
  sale_price: string;
  category: string;
  stock: string;
  featured: boolean;
  published: boolean;
  source_url: string;
  images: string[];
  specs: Record<string, string>;
  variants: VariantGroup[];
};

const emptyDraft: Draft = {
  name: "",
  tagline: "",
  description: "",
  price: "",
  sale_price: "",
  category: "Watches",
  stock: "1",
  featured: false,
  published: true,
  source_url: "",
  images: [],
  specs: { case: "", movement: "", glass: "", water: "" },
  variants: [],
};

function toDraft(product: Product): Draft {
  return {
    name: product.name,
    tagline: product.tagline ?? "",
    description: product.description ?? "",
    price: String(product.price),
    sale_price: product.sale_price === null ? "" : String(product.sale_price),
    category: product.category,
    stock: String(product.stock),
    featured: product.featured,
    published: product.published,
    source_url: product.source_url ?? "",
    images: product.images,
    specs: { case: "", movement: "", glass: "", water: "", ...product.specs },
    variants: product.variants ?? [],
  };
}

export function ProductEditor({
  editing,
  onDone,
}: {
  editing: Product | null;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(editing ? toDraft(editing) : emptyDraft);
  const [link, setLink] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [busy, setBusy] = useState<null | "save" | "ai" | "import" | "upload">(null);
  const queryClient = useQueryClient();
  const runEnhance = useServerFn(enhanceDescription);
  const runImport = useServerFn(importFromLink);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const updateGroup = (gi: number, group: VariantGroup) =>
    setDraft((d) => ({ ...d, variants: d.variants.map((g, i) => (i === gi ? group : g)) }));

  const updateOption = (gi: number, oi: number, option: VariantGroup["options"][number]) =>
    setDraft((d) => ({
      ...d,
      variants: d.variants.map((g, i) =>
        i === gi ? { ...g, options: g.options.map((o, j) => (j === oi ? option : o)) } : g,
      ),
    }));

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy("upload");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadStoreImage(file));
      set("images", [...draft.images, ...urls]);
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  };

  const handleAi = async () => {
    if (!draft.name.trim()) {
      toast.error("Add the watch name first");
      return;
    }
    setBusy("ai");
    try {
      const specs = Object.fromEntries(Object.entries(draft.specs).filter(([, v]) => v.trim()));
      const result = await runEnhance({
        data: {
          name: draft.name,
          tagline: draft.tagline || undefined,
          notes: supplierNotes || draft.description || undefined,
          specs,
        },
      });
      set("description", result.description);
      toast.success("Description rewritten by AI");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI could not generate copy");
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    if (!link.trim()) return;
    setBusy("import");
    try {
      const result = await runImport({ data: { url: link.trim() } });
      setDraft((d) => ({
        ...d,
        name: result.name || d.name,
        tagline: result.tagline || d.tagline,
        description: result.description || d.description,
        price: result.price ? String(result.price) : d.price,
        category: result.category || d.category,
        source_url: link.trim(),
        images: [...d.images, ...result.images].slice(0, 8),
        specs: { ...d.specs, ...result.specs },
      }));
      toast.success("Supplier product imported and rewritten");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.price) {
      toast.error("Name and price are required");
      return;
    }
    setBusy("save");
    try {
      const specs = Object.fromEntries(Object.entries(draft.specs).filter(([, v]) => v.trim()));
      const payload = {
        name: draft.name.trim(),
        slug: editing ? editing.slug : `${slugify(draft.name)}-${Date.now().toString(36).slice(-4)}`,
        tagline: draft.tagline || null,
        description: draft.description || null,
        price: Number(draft.price),
        sale_price: draft.sale_price ? Number(draft.sale_price) : null,
        category: draft.category || "Watches",
        stock: Number(draft.stock) || 0,
        featured: draft.featured,
        published: draft.published,
        source_url: draft.source_url || null,
        images: draft.images,
        specs,
        variants: draft.variants,
      };

      const { error } = editing
        ? await supabase.from("products").update(payload).eq("id", editing.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(editing ? "Product updated" : "Product published");
      setDraft(emptyDraft);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the product");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Panel title="Import from a supplier link">
        <p className="mb-3 text-xs text-white/50">
          Paste a product page from an external supplier. AI reads the page and rewrites the
          description as original boutique copy.
        </p>
        <div className="flex gap-2">
          <input
            className={adminField}
            placeholder="https://supplier.com/product…"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <GoldButton onClick={handleImport} disabled={busy !== null}>
            {busy === "import" ? "Reading…" : "Fetch"}
          </GoldButton>
        </div>
      </Panel>

      <Panel title={editing ? `Editing: ${editing.name}` : "New product"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <Label>Name</Label>
            <input
              className={adminField}
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <Label>Tagline</Label>
            <input
              className={adminField}
              placeholder="Brushed Steel / Quartz"
              value={draft.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </label>
          <label className="block">
            <Label>Price (ZAR / R)</Label>
            <input
              type="number"
              min="0"
              step="1"
              className={adminField}
              value={draft.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </label>
          <label className="block">
            <Label>Sale price (optional)</Label>
            <input
              type="number"
              min="0"
              step="1"
              className={adminField}
              value={draft.sale_price}
              onChange={(e) => set("sale_price", e.target.value)}
            />
          </label>
          <label className="block">
            <Label>Category</Label>
            <input
              className={adminField}
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </label>
          <label className="block">
            <Label>Stock</Label>
            <input
              type="number"
              min="0"
              className={adminField}
              value={draft.stock}
              onChange={(e) => set("stock", e.target.value)}
            />
          </label>

          {(["case", "movement", "glass", "water"] as const).map((key) => (
            <label key={key} className="block">
              <Label>{key}</Label>
              <input
                className={adminField}
                value={draft.specs[key] ?? ""}
                onChange={(e) => set("specs", { ...draft.specs, [key]: e.target.value })}
              />
            </label>
          ))}

          <label className="block sm:col-span-2">
            <Label>Supplier notes / raw text (AI input, not published)</Label>
            <textarea
              rows={3}
              className={adminField}
              placeholder="Paste the supplier's rough text here…"
              value={supplierNotes}
              onChange={(e) => setSupplierNotes(e.target.value)}
            />
          </label>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              <GoldButton onClick={handleAi} disabled={busy !== null}>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-3" />
                  {busy === "ai" ? "Writing…" : "Write with AI"}
                </span>
              </GoldButton>
            </div>
            <textarea
              rows={7}
              className={adminField}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Images</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {draft.images.map((src) => (
                <div key={src} className="relative size-20 overflow-hidden rounded-lg bg-white/10">
                  <img src={src} alt="" className="size-full object-cover" />
                  <button
                    onClick={() =>
                      set(
                        "images",
                        draft.images.filter((i) => i !== src),
                      )
                    }
                    className="absolute right-1 top-1 rounded bg-obsidian/80 p-1"
                    aria-label="Remove image"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              <label className="grid size-20 cursor-pointer place-items-center rounded-lg border border-dashed border-white/20 text-white/40">
                <Upload className="size-4" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void handleUpload(e.target.files)}
                />
              </label>
            </div>
            {busy === "upload" && <p className="mt-2 text-xs text-white/50">Uploading…</p>}
            <input
              className={`${adminField} mt-3`}
              placeholder="…or paste an image address"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value) {
                    set("images", [...draft.images, value]);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Variations (e.g. colour)</Label>
              <GoldButton
                onClick={() =>
                  set("variants", [...draft.variants, { name: "Colour", options: [{ name: "" }] }])
                }
              >
                Add group
              </GoldButton>
            </div>
            <p className="mt-2 text-xs text-white/50">
              Each option can have its own photo and a price difference (use a minus for cheaper).
            </p>

            {draft.variants.map((group, gi) => (
              <div key={gi} className="mt-3 rounded-lg border border-white/10 p-3">
                <div className="flex gap-2">
                  <input
                    className={adminField}
                    placeholder="Group name"
                    value={group.name}
                    onChange={(e) => updateGroup(gi, { ...group, name: e.target.value })}
                  />
                  <GhostButton
                    onClick={() => set("variants", draft.variants.filter((_, i) => i !== gi))}
                  >
                    Remove
                  </GhostButton>
                </div>

                {group.options.map((option, oi) => (
                  <div key={oi} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_100px_auto]">
                    <input
                      className={adminField}
                      placeholder="Option name (Midnight)"
                      value={option.name}
                      onChange={(e) => updateOption(gi, oi, { ...option, name: e.target.value })}
                    />
                    <input
                      className={adminField}
                      placeholder="Photo address (optional)"
                      value={option.image ?? ""}
                      onChange={(e) =>
                        updateOption(gi, oi, { ...option, image: e.target.value || null })
                      }
                    />
                    <input
                      type="number"
                      className={adminField}
                      placeholder="± R"
                      value={option.price_delta ?? ""}
                      onChange={(e) =>
                        updateOption(gi, oi, {
                          ...option,
                          price_delta: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                    <GhostButton
                      onClick={() =>
                        updateGroup(gi, {
                          ...group,
                          options: group.options.filter((_, i) => i !== oi),
                        })
                      }
                    >
                      <Trash2 className="size-3" />
                    </GhostButton>
                  </div>
                ))}

                <div className="mt-2">
                  <GhostButton
                    onClick={() =>
                      updateGroup(gi, { ...group, options: [...group.options, { name: "" }] })
                    }
                  >
                    Add option
                  </GhostButton>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-5 sm:col-span-2">
            <label className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />
              Show on homepage
            </label>
            <label className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => set("published", e.target.checked)}
              />
              Visible in store
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <PrimaryButton onClick={save} disabled={busy !== null}>
            {busy === "save" ? "Saving…" : editing ? "Save changes" : "Publish product"}
          </PrimaryButton>
          {editing && (
            <GhostButton
              onClick={() => {
                setDraft(emptyDraft);
                onDone();
              }}
            >
              Cancel
            </GhostButton>
          )}
        </div>
      </Panel>
    </div>
  );
}
