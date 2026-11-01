// 공개 API용 브라우저 메모리 캐시 + 동일 키 요청 dedupe.
// 인증/사용자별 응답에는 쓰지 않는다.

const store = new Map();
const inflight = new Map();

function abortError() {
  const err = new Error('Aborted');
  err.name = 'AbortError';
  return err;
}

/**
 * @template T
 * @param {string} key
 * @param {number} ttlMs
 * @param {() => Promise<T>} loader
 * @param {AbortSignal} [signal]
 * @returns {Promise<T>}
 */
export function withPublicCache(key, ttlMs, loader, signal) {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return Promise.resolve(hit.value);
  }

  let pending = inflight.get(key);
  if (!pending) {
    pending = Promise.resolve()
      .then(loader)
      .then((value) => {
        store.set(key, { value, at: Date.now() });
        return value;
      })
      .finally(() => {
        inflight.delete(key);
      });
    inflight.set(key, pending);
  }

  if (!signal) return pending;

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }

    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(abortError());
    };

    signal.addEventListener('abort', onAbort);
    pending.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        if (signal.aborted) reject(abortError());
        else resolve(value);
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      },
    );
  });
}

/** 테스트·로그아웃 후 공개 캐시를 비울 때 사용 */
export function clearPublicCache(prefix) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
