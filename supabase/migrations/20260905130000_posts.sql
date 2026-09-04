-- 20260905130000_posts.sql —— 部落格文章
--
-- 參考台大農經的 news（agec-web/supabase/migrations/20260827140000_news_body.sql 與
-- 20260831120000_news_extend.sql）。抄的是它的內容模型：`content_html` 給前台直接
-- 渲染、`content_json` 存編輯器的原始結構、`status` 分草稿與發布。
--
-- **沒有**抄的：雙語欄位（beunion 全站純中文，欄位加了沒有讀它的程式碼，就會變成
-- 農經自己在 0020 檔頭警告過的那種殭屍欄位）、attachments、speaker/venue/event_at
-- （活動資訊在 events 表已經有了，再放一份會有兩個真相）。
--
-- 為什麼同時存 html 與 json：json 是編輯器（TipTap）的來源真相，重新開啟編輯時要
-- 靠它還原；html 是渲染用的快照，前台不必在瀏覽器端跑一次編輯器就能顯示。只留 json
-- 的話前台得裝整個編輯器，只留 html 的話再次編輯會失真。


create table if not exists public.post_categories (
  id         text primary key,
  label      text not null check (char_length(label) between 1 and 60),
  sort_order integer not null default 0
);

insert into public.post_categories (id, label, sort_order) values
  ('news',      '工會消息', 10),
  ('advocacy',  '權益倡議', 20),
  ('knowledge', '保育知識', 30),
  ('story',     '志工故事', 40)
on conflict (id) do nothing;


create table if not exists public.posts (
  id              text primary key,
  title           text not null check (char_length(title) between 1 and 200),
  excerpt         text not null default '' check (char_length(excerpt) <= 500),
  content_html    text not null default '',
  -- 編輯器的原始結構。null 代表這篇不是用編輯器建立的（例如日後從別處匯入），
  -- 後台開啟時要能從 content_html 退回純文字，而不是整個壞掉。
  content_json    jsonb,
  category        text references public.post_categories (id) on update cascade on delete set null,
  cover_image_url text not null default '' check (char_length(cover_image_url) <= 500),
  author_name     text not null default '' check (char_length(author_name) <= 100),
  status          text not null default 'draft' check (status in ('draft', 'published')),
  -- 第一次發布時才寫入，之後再編輯不會更動，所以前台的排序不會因為改錯字而跳動。
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists posts_published on public.posts (published_at desc)
  where status = 'published';
create index if not exists posts_category on public.posts (category, published_at desc);

alter table public.posts enable row level security;
alter table public.post_categories enable row level security;

-- 草稿對外完全不存在。跟 events.is_published 同一個原則（20260905000000 §1）。
create policy "Public can read published posts"
on public.posts
for select
to anon, authenticated
using (status = 'published');

create policy "Public can read post categories"
on public.post_categories
for select
to anon, authenticated
using (true);

revoke all on public.posts from anon, authenticated;
revoke all on public.post_categories from anon, authenticated;
grant select on public.posts to anon, authenticated;
grant select on public.post_categories to anon, authenticated;
grant all on public.posts to service_role;
grant all on public.post_categories to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 後台 RPC
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 一律 operator 也能用（寫文章是操作者的日常），管理者專屬的只有人員與日誌。

create or replace function public.admin_list_posts(p_admin_user_id uuid)
returns table (
  id text,
  title text,
  excerpt text,
  content_html text,
  content_json jsonb,
  category text,
  category_label text,
  cover_image_url text,
  author_name text,
  status text,
  published_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin(p_admin_user_id);

  return query
  select
    posts.id, posts.title, posts.excerpt, posts.content_html, posts.content_json,
    posts.category, categories.label, posts.cover_image_url, posts.author_name,
    posts.status, posts.published_at, posts.updated_at
  from public.posts posts
  left join public.post_categories categories on categories.id = posts.category
  order by coalesce(posts.published_at, posts.created_at) desc, posts.id;
end;
$$;

revoke all on function public.admin_list_posts(uuid) from public, anon, authenticated;
grant execute on function public.admin_list_posts(uuid) to service_role;


create or replace function public.admin_upsert_post(
  p_admin_user_id uuid,
  p_id text,
  p_title text,
  p_excerpt text,
  p_content_html text,
  p_content_json jsonb,
  p_category text,
  p_cover_image_url text,
  p_author_name text,
  p_status text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id text;
  was_new boolean;
  already_published boolean;
begin
  perform private.require_admin(p_admin_user_id);

  if btrim(coalesce(p_id, '')) = '' then
    raise exception using errcode = 'P0001', message = 'POST_ID_REQUIRED';
  end if;
  if btrim(coalesce(p_title, '')) = '' then
    raise exception using errcode = 'P0001', message = 'POST_TITLE_REQUIRED';
  end if;
  if p_status not in ('draft', 'published') then
    raise exception using errcode = 'P0001', message = 'INVALID_STATUS';
  end if;

  select (posts.published_at is not null)
  into already_published
  from public.posts
  where posts.id = btrim(p_id)
  for update;

  was_new := not found;

  insert into public.posts (
    id, title, excerpt, content_html, content_json, category,
    cover_image_url, author_name, status, published_at
  )
  values (
    btrim(p_id), btrim(p_title), btrim(coalesce(p_excerpt, '')),
    coalesce(p_content_html, ''), p_content_json,
    nullif(btrim(coalesce(p_category, '')), ''),
    btrim(coalesce(p_cover_image_url, '')), btrim(coalesce(p_author_name, '')),
    p_status,
    case when p_status = 'published' then now() else null end
  )
  on conflict (id) do update
  set
    title = excluded.title,
    excerpt = excluded.excerpt,
    content_html = excluded.content_html,
    content_json = excluded.content_json,
    category = excluded.category,
    cover_image_url = excluded.cover_image_url,
    author_name = excluded.author_name,
    status = excluded.status,
    -- 只有「首次發布」才蓋 published_at。已發布過的維持原值，撤回草稿再發布也
    -- 不重設 —— 否則修個錯字整篇就會跳到列表最前面。
    published_at = case
      when excluded.status = 'published' and not coalesce(already_published, false) then now()
      else public.posts.published_at
    end,
    updated_at = now()
  returning public.posts.id into saved_id;

  perform private.write_audit(
    p_admin_user_id,
    case when was_new then 'insert' else 'update' end,
    'posts', saved_id, btrim(p_title)
  );

  return saved_id;
end;
$$;

revoke all on function public.admin_upsert_post(
  uuid, text, text, text, text, jsonb, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.admin_upsert_post(
  uuid, text, text, text, text, jsonb, text, text, text, text
) to service_role;


create or replace function public.admin_delete_post(
  p_admin_user_id uuid,
  p_post_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_title text;
begin
  perform private.require_admin(p_admin_user_id);

  select posts.title into target_title from public.posts where posts.id = p_post_id;

  delete from public.posts where public.posts.id = p_post_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'POST_NOT_FOUND';
  end if;

  perform private.write_audit(p_admin_user_id, 'delete', 'posts', p_post_id, target_title);
end;
$$;

revoke all on function public.admin_delete_post(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_delete_post(uuid, text) to service_role;
