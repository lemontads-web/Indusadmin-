-- ════════════════════════════════════════════════════════════════════
-- Indus Heaters — Phase 1: file storage
--   media               : public  — product photos, category tiles, banners
--   enquiry-attachments : private — drawings/photos customers attach;
--                         visitors may only drop files into incoming/,
--                         only owner/sales can open them.
-- ════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760,                       -- 10 MB
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']),
  ('enquiry-attachments', 'enquiry-attachments', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-excel', 'application/dxf', 'image/vnd.dxf'])
on conflict (id) do nothing;

-- media: anyone can view (bucket is public); editors upload/replace; owner deletes
create policy "editors upload media files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.can_edit_content());
create policy "editors replace media files" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.can_edit_content())
  with check (bucket_id = 'media' and public.can_edit_content());
create policy "owner deletes media files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_owner());

-- enquiry attachments: visitors upload into incoming/<random-id>/file only
create policy "visitors drop enquiry files" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'enquiry-attachments'
              and (storage.foldername(name))[1] = 'incoming'
              and array_length(storage.foldername(name), 1) = 2);
create policy "sales opens enquiry files" on storage.objects
  for select to authenticated
  using (bucket_id = 'enquiry-attachments' and public.can_manage_enquiries());
create policy "owner deletes enquiry files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'enquiry-attachments' and public.is_owner());
