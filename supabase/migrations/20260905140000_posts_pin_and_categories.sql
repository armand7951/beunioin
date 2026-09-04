-- 20260905140000_posts_pin_and_categories.sql —— 置頂欄位與真實分類
--
-- 20260905130000 建 posts 時，分類是我憑空種的四個（工會消息／權益倡議／保育知識／
-- 志工故事）。實際站上那七篇文章用的是另外三個：工會公告／活動紀錄／知識分享。
-- 這一支把分類換成真的在用的那組，並補上首頁公佈欄需要的置頂旗標。
--
-- 換分類是安全的：此時 posts 還是空的（驗收用的那篇已刪），沒有任何列引用舊分類。


alter table public.posts
  add column if not exists is_pinned boolean not null default false;

create index if not exists posts_pinned
  on public.posts (is_pinned desc, published_at desc)
  where status = 'published';

-- 先補新的再刪舊的。反過來的話，中間那一瞬間 post_categories 是空的，
-- 而 posts.category 有 on delete set null 的外鍵。
insert into public.post_categories (id, label, sort_order) values
  ('announcement', '工會公告', 10),
  ('activity',     '活動紀錄', 20),
  ('knowledge',    '知識分享', 30)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;

delete from public.post_categories
where id in ('news', 'advocacy', 'story')
  and not exists (
    select 1 from public.posts where public.posts.category = public.post_categories.id
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- 兩支 RPC 要跟著改
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ⚠️ admin_list_posts 的 returns table 多了一欄 —— **create or replace 改不動
--    RETURNS TABLE 的形狀**，會回 42P13 說不能改函式的回傳型別。必須先 drop。
--    admin_upsert_post 則是參數變多，create or replace 會建出第二個多載而不是
--    取代原本那支，於是 PostgREST 呼叫時撞到「找不到唯一的函式」。同樣要先 drop。

drop function if exists public.admin_list_posts(uuid);

create function public.admin_list_posts(p_admin_user_id uuid)
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
  is_pinned boolean,
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
    posts.status, posts.is_pinned, posts.published_at, posts.updated_at
  from public.posts posts
  left join public.post_categories categories on categories.id = posts.category
  order by posts.is_pinned desc, coalesce(posts.published_at, posts.created_at) desc, posts.id;
end;
$$;

revoke all on function public.admin_list_posts(uuid) from public, anon, authenticated;
grant execute on function public.admin_list_posts(uuid) to service_role;


drop function if exists public.admin_upsert_post(
  uuid, text, text, text, text, jsonb, text, text, text, text
);

create function public.admin_upsert_post(
  p_admin_user_id uuid,
  p_id text,
  p_title text,
  p_excerpt text,
  p_content_html text,
  p_content_json jsonb,
  p_category text,
  p_cover_image_url text,
  p_author_name text,
  p_status text,
  p_is_pinned boolean default false,
  -- 匯入舊文章時要保留原始發布日期，不能讓它們全部變成匯入當下的時間。
  -- 平常從後台儲存不會帶這個參數，維持「首次發布才蓋時間」的行為。
  p_published_at timestamptz default null
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
    cover_image_url, author_name, status, is_pinned, published_at
  )
  values (
    btrim(p_id), btrim(p_title), btrim(coalesce(p_excerpt, '')),
    coalesce(p_content_html, ''), p_content_json,
    nullif(btrim(coalesce(p_category, '')), ''),
    btrim(coalesce(p_cover_image_url, '')), btrim(coalesce(p_author_name, '')),
    p_status, coalesce(p_is_pinned, false),
    case
      when p_published_at is not null then p_published_at
      when p_status = 'published' then now()
      else null
    end
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
    is_pinned = excluded.is_pinned,
    -- 明確指定就照用（匯入）；否則只有首次發布才蓋，改錯字不會讓舊文跳到最前面。
    published_at = case
      when p_published_at is not null then p_published_at
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
  uuid, text, text, text, text, jsonb, text, text, text, text, boolean, timestamptz
) from public, anon, authenticated;
grant execute on function public.admin_upsert_post(
  uuid, text, text, text, text, jsonb, text, text, text, text, boolean, timestamptz
) to service_role;
