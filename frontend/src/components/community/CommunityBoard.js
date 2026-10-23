'use client';

// 커뮤니티 (P2): 검색 + 카테고리 + 글 목록 + 글쓰기
// ⚠️ 서버·로그인 연결 전이라 글은 화면에만 저장됨 (새로고침하면 사라짐) → 나중에 Supabase 테이블로 교체
import { useState } from 'react';
import styles from './CommunityBoard.module.css';

const CATS = ['이주 후기', '동네 추천', '질문·답변', '정보 공유'];
const ICON = {
  '이주 후기': 'M4 5h16v11H8l-4 4z M8 10h8',
  '동네 추천': 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  '질문·답변': 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14 M12 17.5h.01 M12 3a9 9 0 1 0 .01 0',
  '정보 공유': 'M12 3l2.6 5.6 6 .7-4.5 4 1.2 6L12 16.4 6.7 19.3l1.2-6-4.5-4 6-.7z',
};

const SAMPLE = [
  { id: 1, cat: '이주 후기', tag: '이주 후기', title: '해운대에서 6개월 살아본 후기', body: '부산으로 온 지 6개월, 생활비와 만족도를 솔직하게 공유해요!', gu: '해운대구', time: '2시간 전', comments: 12 },
  { id: 2, cat: '정보 공유', tag: '일자리', title: '부산에서 일자리 구하기', body: 'IT 직군 채용 정보와 면접 경험을 정리했어요.', gu: '부산진구', time: '5시간 전', comments: 8 },
  { id: 3, cat: '질문·답변', tag: '질문·답변', title: '부산 동네 추천해주세요!', body: '조용하고 생활하기 편한 동네 어디일까요?', gu: '', time: '1일 전', comments: 21 },
  { id: 4, cat: '동네 추천', tag: '동네 추천', title: '광안리 근처 원룸, 바다 보이는 집 구한 팁', body: '남천동·민락동 쪽 매물 볼 때 확인한 것들을 정리해봤어요.', gu: '수영구', time: '2일 전', comments: 6 },
];

export default function CommunityBoard() {
  const [posts, setPosts] = useState(SAMPLE);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('전체');
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ cat: CATS[0], title: '', body: '' });

  const query = q.trim();
  const list = posts.filter((p) => (cat === '전체' || p.cat === cat) && (!query || (p.title + p.body + p.gu).includes(query)));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setPosts([{ id: Date.now(), cat: form.cat, tag: form.cat, title: form.title.trim(), body: form.body.trim(), gu: '', time: '방금 전', comments: 0, mine: true }, ...posts]);
    setForm({ cat: CATS[0], title: '', body: '' });
    setWriting(false);
    setCat('전체');
  };

  return (
    <>
      <div className={styles.searchRow}>
        <label className={styles.searchBox}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="관심있는 글을 검색해 보세요." aria-label="글 검색" />
        </label>
        <button className="btn" style={{ minHeight: 52, padding: '0 26px' }} onClick={() => setWriting(!writing)}>{writing ? '닫기' : '글쓰기'}</button>
      </div>

      {writing && (
        <form className="card stack section" onSubmit={submit}>
          <div className="chips">
            {CATS.map((c) => (
              <button type="button" key={c} className={form.cat === c ? 'chip on' : 'chip'} onClick={() => setForm({ ...form, cat: c })}>{c}</button>
            ))}
          </div>
          <input className={styles.textInput} placeholder="제목" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className={styles.textInput} rows={4} placeholder="내용을 입력해 주세요." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span className="small muted">로그인·DB 연결 전이라 새로고침하면 글이 사라져요.</span>
            <button className="btn" type="submit" disabled={!form.title.trim()}>등록하기</button>
          </div>
        </form>
      )}

      <div className="chips filter-chips section">
        {['전체', ...CATS].map((c) => (
          <button key={c} className={cat === c ? 'chip big on' : 'chip big'} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="stack" style={{ gap: 14 }}>
        {list.length === 0 && <div className="card muted">{query ? `'${query}'에 맞는 글이 없어요.` : '아직 글이 없어요.'}</div>}
        {list.map((p) => (
          <article key={p.id} className={styles.card}>
            <span className={styles.thumb} style={{ width: 136, height: 90 }} aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={ICON[p.cat]} /></svg>
            </span>
            <div className="stack" style={{ gap: 4, minWidth: 0 }}>
              <h3>{p.title}</h3>
              {p.body && <span className="small muted">{p.body}</span>}
              <div className={styles.meta}>
                {p.gu && <span>{p.gu}</span>}<span>{p.time}</span><span>댓글 {p.comments}</span>{p.mine && <span style={{ color: 'var(--brand)' }}>내 글</span>}
              </div>
            </div>
            <span className="tag">{p.tag}</span>
          </article>
        ))}
      </div>
      <p className="small warn" style={{ margin: '14px 0 0' }}>게시글은 화면 확인용 예시예요. 커뮤니티는 P2(후순위) 기능이에요.</p>
    </>
  );
}
