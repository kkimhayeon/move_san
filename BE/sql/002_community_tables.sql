-- COMMUNITY-001~008 1차용 테이블
-- 적용: Supabase SQL Editor에서 이 파일만 실행 (Flask 자동 실행 없음).
-- 기존 profiles / housing / 거래 테이블은 변경·삭제하지 않는다.
-- SECURITY DEFINER / RPC 없음. Flask는 service_role(secret)로 접근한다.
--
-- 적용 전 확인:
--   1) public.profiles 테이블이 존재하는가
--   2) public.profiles.id 가 UUID PK(또는 UNIQUE)인가
--      예: select column_name, data_type, is_nullable
--          from information_schema.columns
--          where table_schema='public' and table_name='profiles' and column_name='id';
--   확인된 저장소 코드(BE/services/user_service.py, 명세 x-auth-flow)는
--   profiles.id = auth.users.id(UUID) 를 전제로 하나, 실제 DB DDL은 이 저장소에 없음.

BEGIN;

CREATE TABLE IF NOT EXISTS public.post_categories (
    code text PRIMARY KEY,
    name text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    category_code text NOT NULL REFERENCES public.post_categories (code) ON DELETE RESTRICT,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    CONSTRAINT posts_title_len_chk CHECK (
        char_length(btrim(title)) BETWEEN 1 AND 100
    ),
    CONSTRAINT posts_content_len_chk CHECK (
        char_length(btrim(content)) BETWEEN 1 AND 10000
    )
);

CREATE TABLE IF NOT EXISTS public.comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.posts (id) ON DELETE RESTRICT,
    author_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    CONSTRAINT comments_content_len_chk CHECK (
        char_length(btrim(content)) BETWEEN 1 AND 1000
    )
);

-- 2차 사진 기능 준비용. 1차 API에서는 사용하지 않는다. 파일 바이너리는 저장하지 않는다.
CREATE TABLE IF NOT EXISTS public.post_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    post_id uuid NULL REFERENCES public.posts (id) ON DELETE RESTRICT,
    storage_path text NOT NULL,
    public_url text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS posts_list_idx
    ON public.posts (created_at DESC, id DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS posts_author_id_idx
    ON public.posts (author_id);

CREATE INDEX IF NOT EXISTS posts_category_code_idx
    ON public.posts (category_code);

CREATE INDEX IF NOT EXISTS comments_post_list_idx
    ON public.comments (post_id, created_at ASC, id ASC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS comments_author_id_idx
    ON public.comments (author_id);

CREATE INDEX IF NOT EXISTS post_images_owner_id_idx
    ON public.post_images (owner_id);

CREATE INDEX IF NOT EXISTS post_images_post_id_idx
    ON public.post_images (post_id);

-- 카테고리 시드는 003_community_boards_images.sql 에서 관리한다.
-- (구 free/자유게시판 시드는 더 이상 여기서 생성하지 않는다.)

ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- 브라우저 anon/authenticated 직접 접근 차단. 정책(SELECT/INSERT 등)을 추가하지 않는다.
-- service_role은 RLS를 우회하므로 Flask 서버 키로만 접근한다.

REVOKE ALL ON TABLE public.post_categories FROM PUBLIC;
REVOKE ALL ON TABLE public.posts FROM PUBLIC;
REVOKE ALL ON TABLE public.comments FROM PUBLIC;
REVOKE ALL ON TABLE public.post_images FROM PUBLIC;

REVOKE ALL ON TABLE public.post_categories FROM anon, authenticated;
REVOKE ALL ON TABLE public.posts FROM anon, authenticated;
REVOKE ALL ON TABLE public.comments FROM anon, authenticated;
REVOKE ALL ON TABLE public.post_images FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.post_categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.posts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.post_images TO service_role;

COMMIT;
