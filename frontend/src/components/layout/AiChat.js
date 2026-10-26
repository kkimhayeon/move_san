'use client';

// 무브산 AI 챗봇 — 오른쪽 아래 버튼을 누르면 페이지 위에 채팅창이 뜬다 (새 페이지 X)
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/api/client';
import { sendChat } from '@/api/chat';
import { ROUTES } from '@/constants/routes';
import { useApp, useNumbers } from '@/stores/comparison';
import { localReply, SUGGESTIONS } from '@/utils/chatbot';
import styles from './AiChat.module.css';

// **굵게**와 줄바꿈만 처리하는 간단한 표시
function Rich({ text }) {
  return text.split('\n').map((line, i) => (
    <p key={i}>
      {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part
      )}
    </p>
  ));
}

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5 M6 11l6-6 6 6" /></svg>
);

export default function AiChat() {
  const { inputs } = useApp();
  const { values, complete } = useNumbers();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // 대화를 시작하면 맨 아래로, 처음 열 때는 인사말이 보이게 맨 위에서 시작
    if (listRef.current && (msgs.length > 0 || busy)) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, busy, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const ask = async (q) => {
    const question = q.trim();
    if (!question || busy) return;
    const next = [...msgs, { role: 'user', text: question }];
    setMsgs(next);
    setText('');
    setBusy(true);
    const history = next.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
    const [ai] = await Promise.all([sendChat(history, inputs), new Promise((r) => setTimeout(r, 450))]);
    const reply = ai ? { text: ai } : localReply(question, { values, complete });
    setMsgs((m) => [...m, { role: 'bot', ...reply }]);
    setBusy(false);
  };

  // 지도 링크(/map?gu=해운대구)는 이미 지도 화면에 있어도 그 구가 선택되도록 알려줌
  const pickGu = (href) => {
    const gu = new URL(href, 'http://x').searchParams.get('gu');
    if (gu) setTimeout(() => window.dispatchEvent(new CustomEvent('movesan:pick-gu', { detail: gu })), 0);
  };

  const onKeyDown = (e) => {
    // 한글 조합 중 Enter는 무시 (글자가 두 번 보내지는 문제 방지)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      ask(text);
    }
  };

  return (
    <>
      {open && (
        <section className={styles.chat} role="dialog" aria-label="무브산 AI 채팅">
          <header className={styles.head}>
            <img src="/logo-mark.png" alt="" className={styles.avatar} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>무브산 AI</strong>
              <span className={styles.status}>{API_BASE ? 'AI 연결됨' : '데모 응답 모드'}</span>
            </div>
            {msgs.length > 0 && (
              <button className={styles.iconBtn} onClick={() => setMsgs([])} title="새 대화" aria-label="새 대화">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7 M3 4v5h5" /></svg>
              </button>
            )}
          </header>

          <div className={styles.body} ref={listRef}>
            <div className={`${styles.msg} ${styles.bot}`}>
              <p className={styles.title}>서울 → 부산 이주 AI 도우미, 무브산 💬</p>
              <p>안녕하세요! 😀</p>
              <p>부산 이주에 대해 궁금한 점을 남겨주시면 바로 안내해 드릴게요.</p>
              <p className={styles.title} style={{ marginTop: 12 }}>이런 걸 물어볼 수 있어요</p>
              <p>■ 구·군별 원룸 월세와 동네 정보</p>
              <p>■ 서울·부산 생활비 차이</p>
              <p>■ 내 조건으로 1년에 얼마 남는지</p>
              <p>■ 부산 청년 혜택</p>
              <div className={styles.quick}>
                <Link href={ROUTES.home} className={`${styles.pill} ${styles.blue}`} onClick={() => setOpen(false)}>💰 생활비 계산하기</Link>
                <Link href={ROUTES.map} className={`${styles.pill} ${styles.orange}`} onClick={() => setOpen(false)}>🏠 동네 월세 보기</Link>
              </div>
            </div>

            {msgs.length === 0 && (
              <div className={styles.suggest}>
                {SUGGESTIONS.map((s) => <button key={s} className={styles.suggestBtn} onClick={() => ask(s)}>{s}</button>)}
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.user : styles.bot}`}>
                {m.role === 'user' ? m.text : <Rich text={m.text} />}
                {m.links && (
                  <div className={styles.quick}>
                    {m.links.map((l) => <Link key={l.href} href={l.href} className={`${styles.pill} ${styles.blue}`} onClick={() => pickGu(l.href)}>{l.label} →</Link>)}
                  </div>
                )}
                {m.suggest && (
                  <div className={styles.suggest} style={{ marginTop: 10 }}>
                    {SUGGESTIONS.slice(0, 3).map((s) => <button key={s} className={styles.suggestBtn} onClick={() => ask(s)}>{s}</button>)}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className={`${styles.msg} ${styles.bot} ${styles.typing}`} aria-label="답변 작성 중"><span /><span /><span /></div>}
          </div>

          <form className={styles.input} onSubmit={(e) => { e.preventDefault(); ask(text); }}>
            <textarea
              ref={inputRef}
              rows={2}
              value={text}
              placeholder="AI에게 질문해 주세요."
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="질문 입력"
            />
            <button type="submit" className={styles.send} disabled={!text.trim() || busy} aria-label="보내기"><SendIcon /></button>
          </form>
          <p className={styles.note}>AI는 한정된 데이터에 기반하니, 중요한 정보는 추가 확인을 권장해요.</p>
        </section>
      )}

      <button className={open ? `${styles.fab} ${styles.open}` : styles.fab} aria-label={open ? 'AI 채팅 닫기' : 'AI 채팅 열기'} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B4A5E" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12 M18 6L6 18" /></svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
            <line x1="16" y1="4" x2="16" y2="8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="4" r="2" fill="#FFD59A" />
            <rect x="6" y="8" width="20" height="16" rx="6" fill="#fff" />
            <circle cx="12.5" cy="15.5" r="2.2" fill="#2563eb" />
            <circle cx="19.5" cy="15.5" r="2.2" fill="#2563eb" />
            <path d="M13 20.5c1.8 1.2 4.2 1.2 6 0" stroke="#2563eb" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <rect x="3" y="13" width="3" height="6" rx="1.5" fill="#fff" />
            <rect x="26" y="13" width="3" height="6" rx="1.5" fill="#fff" />
          </svg>
        )}
      </button>
    </>
  );
}
