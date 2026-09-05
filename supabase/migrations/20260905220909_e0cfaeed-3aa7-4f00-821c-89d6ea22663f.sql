CREATE POLICY "public read images bucket" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'images');
CREATE POLICY "admins read admin bucket" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'admin' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins upload store files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('images','admin') AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update store files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('images','admin') AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete store files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('images','admin') AND public.has_role(auth.uid(),'admin'));