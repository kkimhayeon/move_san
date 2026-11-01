-- support_policies 공개 읽기 (선택)
-- Flask BE는 SUPABASE_SECRET_KEY(service_role)로 조회하며 RLS를 우회한다.
-- 서비스 코드에서 is_visible=true 및 official_url 비어 있지 않음을 강제한다.
--
-- 브라우저/anon이 PostgREST로 직접 읽을 때만 아래를 SQL Editor에서 수동 실행.
-- 테이블 생성·데이터 INSERT·RLS 비활성화·쓰기 권한 추가는 하지 않는다.

BEGIN;

GRANT SELECT ON TABLE public.support_policies TO anon, authenticated;

DROP POLICY IF EXISTS support_policies_public_select ON public.support_policies;

CREATE POLICY support_policies_public_select
    ON public.support_policies
    FOR SELECT
    TO anon, authenticated
    USING (
        is_visible = true
        AND official_url IS NOT NULL
        AND btrim(official_url) <> ''
    );

COMMIT;
