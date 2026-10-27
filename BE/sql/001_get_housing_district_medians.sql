-- MAP-001/MAP-002: 구군별 환산 월세 중앙값 집계 RPC
-- 적용: Supabase SQL Editor에서 이 파일만 실행 (순서 1/1).
-- 기존 테이블·데이터를 변경하지 않으며, 조회용 함수만 생성/교체한다.
-- SECURITY DEFINER 미사용. Flask는 service_role(secret)로 호출한다.

CREATE OR REPLACE FUNCTION public.get_housing_district_medians()
RETURNS TABLE (
    region_code text,
    name text,
    median_rent numeric,
    sample_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT
        t."sggCd" AS region_code,
        t."sggNm" AS name,
        round(
            (
                percentile_cont(0.5) WITHIN GROUP (
                    ORDER BY c.converted_monthly_rent
                )
            )::numeric,
            4
        ) AS median_rent,
        count(*)::bigint AS sample_count
    FROM public.housing_rent_transactions t
    JOIN public.housing_rent_converted c
        ON c.transaction_id = t.id
    WHERE t."dealYear" * 100 + t."dealMonth"
              BETWEEN 202309 AND 202608
      AND t."housingType" IN (
          '단독/다가구',
          '연립다세대',
          '오피스텔'
      )
      AND t."excluUseAr" > 0
      AND t."excluUseAr" <= 33
      AND c.target_deposit = 1000
      AND c.converted_monthly_rent IS NOT NULL
    GROUP BY t."sggCd", t."sggNm";
$$;

REVOKE ALL ON FUNCTION public.get_housing_district_medians() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_housing_district_medians() TO service_role;

COMMENT ON FUNCTION public.get_housing_district_medians() IS
    '부산 구군별 보증금 1000만원 환산 월세 중앙값(2023-09~2026-08, 전용면적 ≤33㎡). MAP-001/002용.';
