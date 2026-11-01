-- 커뮤니티 게시판 4종 + post_images.sort_order + 글-사진 원자 연결 RPC
-- 적용: Supabase SQL Editor에서 002 적용 후 이 파일을 실행.
-- Flask는 자동 실행하지 않는다. SECURITY DEFINER 없음.

BEGIN;

-- 1) 이미지 표시 순서
ALTER TABLE public.post_images
    ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.post_images.sort_order IS
    '글에 연결된 사진 표시 순서(0부터). image_ids 배열 순서로 부여.';

CREATE INDEX IF NOT EXISTS post_images_post_sort_idx
    ON public.post_images (post_id, sort_order, id)
    WHERE deleted_at IS NULL;

-- 2) 게시판 시드 (목표 4종)
INSERT INTO public.post_categories (code, name, sort_order) VALUES
    ('LOCAL_LIFE', '동네생활', 1),
    ('BUSAN_TIPS', '부산꿀팁', 2),
    ('QNA', 'Q&A', 3),
    ('RESTAURANT_REVIEW', '맛집 후기', 4)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

-- 3) 구 free 시드 정리 (참조 글이 없을 때만 삭제)
DELETE FROM public.post_categories c
WHERE c.code = 'free'
  AND NOT EXISTS (
      SELECT 1 FROM public.posts p WHERE p.category_code = 'free'
  );

-- 4) 글 작성 시 사진 연결을 한 트랜잭션으로 처리
CREATE OR REPLACE FUNCTION public.attach_post_images(
    p_post_id uuid,
    p_owner_id uuid,
    p_image_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_expected integer;
    v_updated integer;
    v_distinct integer;
BEGIN
    v_expected := coalesce(cardinality(p_image_ids), 0);
    IF v_expected = 0 THEN
        RETURN;
    END IF;

    SELECT count(DISTINCT x) INTO v_distinct FROM unnest(p_image_ids) AS x;
    IF v_distinct <> v_expected THEN
        RAISE EXCEPTION 'duplicate image ids' USING ERRCODE = '22023';
    END IF;

    -- 게시글 존재·미삭제·작성자 일치
    IF NOT EXISTS (
        SELECT 1
        FROM public.posts
        WHERE id = p_post_id
          AND author_id = p_owner_id
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'post not found or not owned' USING ERRCODE = '22023';
    END IF;

    UPDATE public.post_images AS pi
    SET
        post_id = p_post_id,
        sort_order = u.ord::integer - 1
    FROM unnest(p_image_ids) WITH ORDINALITY AS u(id, ord)
    WHERE pi.id = u.id
      AND pi.owner_id = p_owner_id
      AND pi.deleted_at IS NULL
      AND pi.post_id IS NULL;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated <> v_expected THEN
        RAISE EXCEPTION 'image attach validation failed' USING ERRCODE = '22023';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_post_images(uuid, uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_post_images(uuid, uuid, uuid[]) TO service_role;

COMMENT ON FUNCTION public.attach_post_images(uuid, uuid, uuid[]) IS
    '게시글에 미연결·본인 소유 이미지를 sort_order 순으로 원자 연결. MAP community image attach.';

COMMIT;
