'use client';

import { useMemo, useState } from 'react';
import {
  MOCK_POLICIES,
  POLICY_CATEGORIES,
  FREQUENCY_LABELS,
  formatWon,
  getPolicyYearlyAmount,
} from '@/lib/benefitsMock';

import BenefitsBasket from './BenefitsBasket';

// 금액 표시
const money = (n) => `${n.toLocaleString('ko-KR')}원`;

// 입력창 스타일
const fieldStyle = {
  width: '100%',
  border: '1px solid #dbe5f1',
  borderRadius: 12,
  padding: '11px 12px',
  background: '#fff',
  color: '#17283d',
  fontSize: 14,
};

// 카드 스타일
const panelStyle = {
  background: '#fff',
  border: '1px solid #e5edf7',
  borderRadius: 18,
  padding: 20,
};

export default function BenefitsComparison() {
  // 기존 검색 필터
  const [region, setRegion] = useState('전체');
  const [category, setCategory] = useState('전체');
  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');

  // 상세 보기
  const [selected, setSelected] = useState(null);

  // 나의 정착 혜택 바구니
  const [basketIds, setBasketIds] = useState([]);

  const ageNumber = age === '' ? null : Number(age);
  const incomeNumber = income === '' ? null : Number(income);

  // 혜택 담기 및 취소
  const toggleBasket = (id) => {
    setBasketIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  // 기존 정책 필터링
  const policies = useMemo(() => {
    return MOCK_POLICIES.filter((p) => {
      if (region !== '전체' && p.region !== region) {
        return false;
      }

      if (category !== '전체' && p.category !== category) {
        return false;
      }

      // 예시 연령 조건
      if (ageNumber !== null) {
        if (
          !Number.isInteger(ageNumber) ||
          ageNumber < 0 ||
          ageNumber > 120
        ) {
          return false;
        }

        if (ageNumber < p.minAge || ageNumber > p.maxAge) {
          return false;
        }
      }

      // 예시 소득 조건
      if (incomeNumber !== null) {
        if (
          !Number.isFinite(incomeNumber) ||
          incomeNumber < 0
        ) {
          return false;
        }

        if (
          p.maxIncome !== null &&
          incomeNumber > p.maxIncome
        ) {
          return false;
        }
      }

      return true;
    });
  }, [region, category, ageNumber, incomeNumber]);

  // 기존 서울·부산 경제적 혜택 비교 계산
  const summary = useMemo(() => {
    const result = {
      서울: { yearly: 0, once: 0, count: 0 },
      부산: { yearly: 0, once: 0, count: 0 },
    };

    for (const p of policies) {
      // 실제 검증되지 않은 정책은 합산하지 않음
      if (p.isMock || p.eligibilityStatus !== 'verified') {
        continue;
      }

      if (p.amount == null) {
        continue;
      }

      // 중복 수혜 규칙 검증 전에는 합산하지 않음
      if (p.exclusiveGroup) {
        continue;
      }

      const yearly = getPolicyYearlyAmount(p);

      if (yearly !== null) {
        result[p.region].yearly += yearly;
        result[p.region].count++;
      } else if (p.frequency === 'once') {
        result[p.region].once += p.amount;
        result[p.region].count++;
      }
    }

    return result;
  }, [policies]);

  const hasVerified =
    summary.서울.count > 0 ||
    summary.부산.count > 0;

  const renderAmount = (regionName) =>
    summary[regionName].count > 0
      ? money(summary[regionName].yearly)
      : '산정 전';

  // 바구니에 담긴 정책
  // 검색 필터를 변경해도 담은 정책은 유지됨
  const basketPolicies = useMemo(() => {
    return basketIds
      .map((id) =>
        MOCK_POLICIES.find((policy) => policy.id === id)
      )
      .filter(Boolean);
  }, [basketIds]);

  return (
    <section style={{ display: 'grid', gap: 24 }}>
      {/* Mock 데이터 안내 */}
      <div
        style={{
          background: '#eff7ff',
          border: '1px solid #dbeafe',
          borderRadius: 16,
          padding: '16px 20px',
          color: '#285b88',
          lineHeight: 1.7,
          fontSize: 14,
        }}
      >
        <strong>정책 비교 데모</strong>
        <div>
          현재 정책명과 금액은 화면 테스트용 가상 데이터입니다.
          실제 수혜 자격, 금액, 신청 가능 여부는
          검증되지 않았습니다.
        </div>
      </div>

      {/* 페이지 소개 */}
      <div>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>
          서울·부산 청년 혜택 비교
        </h2>

        <p style={{ color: '#64748b' }}>
          거주 지역과 나의 조건에 따라 정책을 탐색해 보세요.
          실제 경제적 혜택은 자격 검증 이후 산정됩니다.
        </p>
      </div>

      {/* 서울·부산 혜택 요약 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        {['서울', '부산'].map((name) => (
          <div
            key={name}
            style={{
              ...panelStyle,
              background:
                name === '부산' ? '#eff7ff' : '#fff',
            }}
          >
            <div
              style={{
                color: '#64748b',
                fontSize: 14,
              }}
            >
              {name} 검증된 연간 혜택
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#2563eb',
                margin: '12px 0',
              }}
            >
              {renderAmount(name)}
            </div>

            <div
              style={{
                color: '#64748b',
                fontSize: 13,
              }}
            >
              일회성 혜택:{' '}
              {summary[name].count > 0
                ? money(summary[name].once)
                : '산정 전'}
            </div>
          </div>
        ))}
      </div>

      {/* 지역별 혜택 차이 */}
      <div style={panelStyle}>
        <h3
          style={{
            fontSize: 17,
            marginBottom: 12,
          }}
        >
          지역별 혜택 차이
        </h3>

        {hasVerified ? (
          <>
            <strong style={{ fontSize: 24 }}>
              {money(
                summary.부산.yearly -
                summary.서울.yearly
              )}
            </strong>

            <p
              style={{
                color: '#64748b',
                fontSize: 13,
              }}
            >
              부산 - 서울, 검증된 반복성 연간 혜택 차이.
              일회성 지원은 별도 표시합니다.
            </p>
          </>
        ) : (
          <p
            style={{
              color: '#64748b',
              margin: 0,
            }}
          >
            아직 검증된 정책이 없어 차액을 산정하지 않았습니다.
            가상 지원금은 비교 합계에서 제외됩니다.
          </p>
        )}
      </div>

      {/* 사용자 조건 입력 */}
      <div style={panelStyle}>
        <h3
          style={{
            fontSize: 19,
            marginBottom: 18,
          }}
        >
          나에게 맞는 정책 찾기
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(175px, 1fr))',
            gap: 14,
          }}
        >
          <label>
            <span
              style={{
                display: 'block',
                marginBottom: 8,
              }}
            >
              지역
            </span>

            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={fieldStyle}
            >
              {['전체', '서울', '부산'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span
              style={{
                display: 'block',
                marginBottom: 8,
              }}
            >
              연령 (만 나이)
            </span>

            <input
              type="number"
              min="0"
              max="120"
              step="1"
              placeholder="예: 27"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={fieldStyle}
            />
          </label>

          <label>
            <span
              style={{
                display: 'block',
                marginBottom: 8,
              }}
            >
              연 소득 (세전, 만원)
            </span>

            <input
              type="number"
              min="0"
              step="1"
              placeholder="예: 3000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              style={fieldStyle}
            />
          </label>
        </div>

        <p
          style={{
            fontSize: 12,
            color: '#64748b',
            marginTop: 12,
          }}
        >
          입력값은 현재 화면의 예시 조건을 필터링하는 데만
          사용됩니다. 세대 소득·재산·취업 상태 등
          추가 자격 조건은 아직 반영되지 않았습니다.
        </p>
      </div>

      {/* 카테고리 및 정책 목록 */}
      <div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 18,
          }}
        >
          {POLICY_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              style={{
                padding: '10px 17px',
                borderRadius: 999,
                border: '1px solid #dbe5f1',
                cursor: 'pointer',
                background:
                  category === c ? '#2563eb' : '#fff',
                color:
                  category === c ? '#fff' : '#334155',
                fontWeight: 600,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 나의 정착 혜택 바구니 */}
        {basketPolicies.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <BenefitsBasket
              policies={basketPolicies}
              onRemove={(id) =>
                setBasketIds((prev) =>
                  prev.filter((item) => item !== id)
                )
              }
              onClear={() => setBasketIds([])}
            />
          </div>
        )}

        <p
          style={{
            fontSize: 14,
            color: '#64748b',
            marginBottom: 14,
          }}
        >
          검색 결과 {policies.length}개 · 모두 테스트 데이터
          {' · '}바구니 {basketPolicies.length}개
        </p>

        <div style={{ display: 'grid', gap: 14 }}>
          {policies.map((p) => {
            const isInBasket = basketIds.includes(p.id);

            return (
              <article key={p.id} style={panelStyle}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        background: '#eff6ff',
                        color: '#2563eb',
                        padding: '5px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                      }}
                    >
                      {p.region} · {p.category} · 가상 정책
                    </span>

                    <h3
                      style={{
                        fontSize: 18,
                        marginTop: 12,
                      }}
                    >
                      {p.title}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 23,
                        fontWeight: 800,
                        color: '#2563eb',
                      }}
                    >
                      {formatWon(p.amount)}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: '#64748b',
                      }}
                    >
                      {FREQUENCY_LABELS[p.frequency]} · 예시 금액
                    </div>
                  </div>
                </div>

                <p
                  style={{
                    margin: '14px 0',
                    color: '#64748b',
                    lineHeight: 1.6,
                  }}
                >
                  {p.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: '#b45309',
                    }}
                  >
                    수혜 자격 미확인 · 합산 제외
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* 신규: 혜택 담기 */}
                    <button
                      type="button"
                      onClick={() => toggleBasket(p.id)}
                      aria-pressed={isInBasket}
                      style={{
                        border: '1px solid #bfdbfe',
                        borderRadius: 10,
                        background:
                          isInBasket ? '#eff6ff' : '#fff',
                        padding: '9px 14px',
                        color: '#2563eb',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {isInBasket
                        ? '담기 취소 ✓'
                        : '혜택 담기 +'}
                    </button>

                    {/* 기존: 상세 보기 */}
                    <button
                      type="button"
                      onClick={() =>
                        setSelected(
                          selected === p.id ? null : p.id
                        )
                      }
                      aria-expanded={selected === p.id}
                      style={{
                        border: '1px solid #bfdbfe',
                        borderRadius: 10,
                        background: '#fff',
                        padding: '9px 14px',
                        color: '#2563eb',
                        cursor: 'pointer',
                      }}
                    >
                      {selected === p.id
                        ? '접기'
                        : '상세 보기'}
                    </button>
                  </div>
                </div>

                {/* 기존 정책 상세정보 */}
                {selected === p.id && (
                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 16,
                      borderTop: '1px solid #e5edf7',
                      fontSize: 14,
                      lineHeight: 1.9,
                    }}
                  >
                    <p>
                      연령 예시: 만 {p.minAge}~{p.maxAge}세
                    </p>

                    <p>
                      소득 예시:{' '}
                      {p.maxIncome == null
                        ? '제한 정보 없음'
                        : `연 ${p.maxIncome.toLocaleString()}만원 이하`}
                    </p>

                    <p>
                      지급 주기: {FREQUENCY_LABELS[p.frequency]}
                    </p>

                    <p>주관 기관: {p.organization}</p>
                    <p>자격 상태: 확인되지 않음</p>

                    {p.exclusiveGroup && (
                      <p style={{ color: '#b45309' }}>
                        중복 수혜 여부 확인 필요
                      </p>
                    )}

                    {p.applicationUrl && !p.isMock ? (
                      <a
                        href={p.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#2563eb',
                          fontWeight: 700,
                        }}
                      >
                        공식 신청 페이지 열기 ↗
                      </a>
                    ) : (
                      <p style={{ color: '#64748b' }}>
                        신청 링크: 공식 정책 확인 후 연결 예정
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}

          {policies.length === 0 && (
            <div style={panelStyle}>
              조건에 맞는 정책 예시가 없습니다.
              필터를 변경해 주세요.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}