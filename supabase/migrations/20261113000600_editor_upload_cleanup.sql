-- ════════════════════════════════════════════════════════════════════
-- Indus Heaters — photo file clean-up rules
--  • Staff (owner/editor) can see the photo-file records. Supabase needs
--    this before it lets anyone remove a file (without it even the owner's
--    deletes would fail). The photos themselves are public anyway.
--  • An editor may remove a photo file THEY uploaded that isn't in the
--    photo library (a half-finished upload). Anything else stays owner-only.
-- ════════════════════════════════════════════════════════════════════
-- (safe to run again: old copies of these two rules are removed first)
drop policy if exists "staff see photo files" on storage.objects;
drop policy if exists "editors remove their own unfinished uploads" on storage.objects;

create policy "staff see photo files" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and private.can_edit_content());

create policy "editors remove their own unfinished uploads" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and private.can_edit_content()
    and owner_id = (select auth.uid())::text
    and not exists (select 1 from public.media m where m.bucket = 'media' and m.path = storage.objects.name)
  );
