'use client';

export default function Error({ reset }) {
  return (
    <div className="page" style={{ paddingTop: 56 }}>
      <section className="card stack" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 26 }}>화면을 불러오지 못했어요</h1>
        <p className="muted" style={{ margin: 0 }}>잠시 후 다시 시도해 주세요.</p>
        <button className="btn" style={{ alignSelf: 'center' }} onClick={() => reset()}>다시 시도</button>
      </section>
    </div>
  );
}
