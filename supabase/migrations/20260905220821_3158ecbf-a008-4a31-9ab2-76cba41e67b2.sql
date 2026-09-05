CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.grant_altair_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'altair.store26@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_altair_admin();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'altair.store26@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2),
  images text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'Watches',
  stock integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  source_url text,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published products are public" ON public.products FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "admins read all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  discount_percent integer NOT NULL DEFAULT 10,
  coupon_code text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active sales are public" ON public.sales FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "admins read all sales" ON public.sales FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write sales" ON public.sales FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  shipping_address text NOT NULL,
  notes text,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can place an order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can add order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write order items" ON public.order_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete order items" ON public.order_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.products (slug, name, tagline, description, price, sale_price, images, category, stock, featured, specs) VALUES
('zenith-octagon-white','Zenith Octagon','Brushed Steel / Quartz','A faceted octagonal bezel frames a sunburst silver dial, catching light with every turn of the wrist. The integrated 316L stainless bracelet tapers into a brushed link finish, while a day-date aperture keeps the layout purposeful rather than crowded. Built for the collector who prefers restraint over noise.',2450.00,1950.00,ARRAY['/__l5e/assets-v1/e79688c5-fc0a-48e0-b859-a9abfeaca922/watch-white-dial.png','/__l5e/assets-v1/bbb6cd86-4908-414d-96d2-03e860cfe2a2/box-silver-slim.png'],'Steel',12,true,'{"case":"41mm stainless steel","movement":"Japanese quartz","glass":"Sapphire crystal","water":"5 ATM"}'::jsonb),
('midnight-meridian','Midnight Meridian','Faceted Bezel / Black Dial','A graphite dial sits beneath a knurled silver bezel, applied indices floating above a smoked sunray finish. The tapered steel bracelet balances the case weight so the watch settles rather than slides. Quietly formal, equally at home under a cuff or over a linen sleeve.',1890.00,NULL,ARRAY['/__l5e/assets-v1/cf2615d6-6f35-4796-ab2b-a92cab7342ea/watch-black-dial.jpg'],'Steel',8,true,'{"case":"42mm stainless steel","movement":"Japanese quartz","glass":"Mineral crystal","water":"3 ATM"}'::jsonb),
('verdant-heritage','Verdant Heritage','Emerald Dial / Steel Link','A deep emerald dial with a fine sunburst grain, framed by a polished domed bezel and a classic five-link bracelet. The date window is set flush at three o''clock, and the lume-filled hands hold their glow long after dusk. A vintage silhouette rendered with modern finishing.',1100.00,880.00,ARRAY['/__l5e/assets-v1/e4272dfc-030b-47a9-87bc-d00e7a7ea0a1/watch-green-dial.jpg'],'Heritage',15,true,'{"case":"39mm stainless steel","movement":"Japanese quartz","glass":"Sapphire crystal","water":"5 ATM"}'::jsonb),
('nomad-skeleton','Nomad Skeleton','Open Heart / Rubber Strap','An openworked dial exposes the beating balance wheel inside a tonneau steel case, secured by exposed bezel screws. The moulded rubber strap softens the architecture without diluting it. Delivered in the signature ALTAIRSTORE presentation box.',2400.00,NULL,ARRAY['/__l5e/assets-v1/82bfbb56-8859-4d39-a3d1-b4b6ff9cd037/box-skeleton.png','/__l5e/assets-v1/291d4b83-54f2-4b67-84b9-8486e9429a84/box-skeleton-desk.png'],'Skeleton',6,true,'{"case":"43mm tonneau steel","movement":"Automatic open heart","glass":"Mineral crystal","water":"3 ATM"}'::jsonb),
('altair-slim-noir','Altair Slim Noir','Ultra Thin / Silver Dial','A pared-back 8mm profile with a silver-white dial and a single date aperture. The textured black rubber strap keeps the piece featherlight, making it the natural everyday companion in the collection.',890.00,690.00,ARRAY['/__l5e/assets-v1/bbb6cd86-4908-414d-96d2-03e860cfe2a2/box-silver-slim.png'],'Dress',20,false,'{"case":"40mm stainless steel","movement":"Japanese quartz","glass":"Sapphire crystal","water":"3 ATM"}'::jsonb),
('nomad-skeleton-desk','Nomad Skeleton Noir','Limited Run / 50 Pieces','The Nomad Skeleton in a darkened finish, limited to fifty numbered pieces. Same openworked architecture, deeper contrast, and a boxed set including a spare steel bracelet.',2900.00,NULL,ARRAY['/__l5e/assets-v1/291d4b83-54f2-4b67-84b9-8486e9429a84/box-skeleton-desk.png'],'Skeleton',3,false,'{"case":"43mm tonneau steel","movement":"Automatic open heart","glass":"Sapphire crystal","water":"3 ATM"}'::jsonb);

INSERT INTO public.sales (title, description, discount_percent, coupon_code, ends_at, active) VALUES
('Winter Archive Event','Selected pieces reduced for a limited period.',20,'ALTAIR20', now() + interval '30 days', true);