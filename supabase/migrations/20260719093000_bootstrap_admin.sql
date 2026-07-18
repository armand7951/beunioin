insert into private.admin_users (user_id)
select id
from auth.users
where lower(email) = 'gathertaiwan@gmail.com'
on conflict (user_id) do nothing;
