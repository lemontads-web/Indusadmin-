-- Run ONCE in Supabase → SQL Editor after you have created your login
-- (Authentication → Users → Add user). Replace the email below with the
-- email you used, then press Run. It makes that login the Owner.

insert into public.admin_users (user_id, email, full_name, role)
select id, email, 'Owner', 'owner'
from auth.users
where lower(email) = lower('YOUR-EMAIL@example.com')
on conflict (user_id) do update set role = 'owner', active = true;

-- Check: should show one row with role = owner
select email, role, active from public.admin_users;
