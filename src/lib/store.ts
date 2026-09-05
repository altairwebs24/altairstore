import { supabase } from "@/integrations/supabase/client";

export type VariantOption = {
  name: string;
  image?: string | null;
  price_delta?: number;
};

export type VariantGroup = {
  name: string;
  options: VariantOption[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price: number;
  sale_price: number | null;
  images: string[];
  category: string;
  stock: number;
  featured: boolean;
  published: boolean;
  source_url: string | null;
  specs: Record<string, string>;
  variants: VariantGroup[];
  created_at: string;
};


export type Sale = {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  coupon_code: string | null;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  notes: string | null;
  total: number;
  status: string;
  created_at: string;
};

const PRODUCT_COLUMNS =
  "id, slug, name, tagline, description, price, sale_price, images, category, stock, featured, published, source_url, specs, created_at";

function normalize(row: unknown): Product {
  const p = row as Product & { price: string; sale_price: string | null };
  return {
    ...p,
    price: Number(p.price),
    sale_price: p.sale_price === null ? null : Number(p.sale_price),
    images: p.images ?? [],
    specs: (p.specs ?? {}) as Record<string, string>,
  };
}

export const productsQuery = {
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(normalize);
  },
};

export const allProductsQuery = {
  queryKey: ["products", "all"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(normalize);
  },
};

export function productQuery(slug: string) {
  return {
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? normalize(data) : null;
    },
  };
}

export const salesQuery = {
  queryKey: ["sales"],
  queryFn: async (): Promise<Sale[]> => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Sale[];
  },
};

export const ordersQuery = {
  queryKey: ["orders"],
  queryFn: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((o) => ({ ...o, total: Number(o.total) })) as Order[];
  },
};

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function effectivePrice(product: Product) {
  return product.sale_price ?? product.price;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/** Uploads a file to the public shop image library and returns its permanent link. */
export async function uploadStoreImage(file: File, folder = "products") {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}
