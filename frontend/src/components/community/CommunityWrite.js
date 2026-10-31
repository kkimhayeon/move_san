'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPost, fetchPostCategories, uploadImage } from '@/api/community';
import { useAuth } from '@/components/layout/AuthProvider';
import { BOARD_CODES, BOARD_LABELS, POST_LIMITS } from '@/constants/community';
import { ROUTES } from '@/constants/routes';
import {
  createApiError,
  getUserErrorMessage,
  isAbortError,
  isAuthRequiredError,
} from '@/utils/errors';
import styles from './CommunityWrite.module.css';

function validateFile(file) {
  if (!POST_LIMITS.imageTypes.includes(file.type)) {
    return 'JPEG, PNG, WebP만 첨부할 수 있어요.';
  }
  if (file.size > POST_LIMITS.maxImageBytes) {
    return '사진 한 장은 5MiB 이하여야 해요.';
  }
  return null;
}

export default function CommunityWrite() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputId = useId();
  const [categories, setCategories] = useState(
    BOARD_CODES.map((code) => ({ code, name: BOARD_LABELS[code] })),
  );
  const [categoryCode, setCategoryCode] = useState(BOARD_CODES[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  /** @type {Array<{ key: string, file: File, previewUrl: string, uploadedId: string | null }>} */
  const [photos, setPhotos] = useState([]);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPostCategories()
      .then((data) => {
        if (cancelled) return;
        const items = data?.result?.items;
        if (Array.isArray(items) && items.length) {
          setCategories(items);
          setCategoryCode((current) => (items.some((item) => item.code === current) ? current : items[0].code));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  }, []);

  const removePhoto = (key) => {
    setPhotos((prev) => {
      const target = prev.find((item) => item.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.key !== key);
    });
  };

  const onPickFiles = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setError('');

    setPhotos((prev) => {
      const room = POST_LIMITS.maxImages - prev.length;
      if (room <= 0) {
        setError(`사진은 최대 ${POST_LIMITS.maxImages}장까지 첨부할 수 있어요.`);
        return prev;
      }
      const next = [...prev];
      for (const file of files.slice(0, room)) {
        const invalid = validateFile(file);
        if (invalid) {
          setError(invalid);
          continue;
        }
        next.push({
          key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          uploadedId: null,
        });
      }
      if (files.length > room) {
        setError(`사진은 최대 ${POST_LIMITS.maxImages}장까지 첨부할 수 있어요.`);
      }
      return next;
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle) {
      setError('제목을 입력해 주세요.');
      return;
    }
    if (trimmedTitle.length > POST_LIMITS.titleMax) {
      setError(`제목은 ${POST_LIMITS.titleMax}자 이하여야 해요.`);
      return;
    }
    if (!trimmedContent) {
      setError('내용을 입력해 주세요.');
      return;
    }
    if (trimmedContent.length > POST_LIMITS.contentMax) {
      setError(`내용은 ${POST_LIMITS.contentMax}자 이하여야 해요.`);
      return;
    }
    if (!BOARD_CODES.includes(categoryCode)) {
      setError('게시판을 선택해 주세요.');
      return;
    }

    setPending(true);
    setError('');
    setNeedsLogin(false);
    setProgress('등록 준비 중…');

    try {
      const imageIds = [];
      for (let i = 0; i < photos.length; i += 1) {
        const photo = photos[i];
        if (photo.uploadedId) {
          imageIds.push(photo.uploadedId);
          continue;
        }
        setProgress(`사진 업로드 중… (${i + 1}/${photos.length})`);
        try {
          const uploaded = await uploadImage(photo.file);
          const id = uploaded?.result?.id;
          if (!id) throw createApiError({ kind: 'parse' });
          imageIds.push(id);
          setPhotos((prev) => prev.map((item) => (
            item.key === photo.key ? { ...item, uploadedId: id } : item
          )));
        } catch (uploadErr) {
          if (isAbortError(uploadErr)) return;
          setNeedsLogin(isAuthRequiredError(uploadErr));
          setError(getUserErrorMessage(uploadErr, '사진 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.'));
          setProgress('');
          setPending(false);
          return;
        }
      }

      setProgress('글 등록 중…');
      const body = {
        title: trimmedTitle,
        content: trimmedContent,
        category_code: categoryCode,
      };
      if (imageIds.length) body.image_ids = imageIds;

      const created = await createPost(body);
      const id = created?.result?.id;
      if (!id) throw createApiError({ kind: 'parse' });
      router.replace(ROUTES.communityPost(id));
    } catch (err) {
      if (isAbortError(err)) return;
      setNeedsLogin(isAuthRequiredError(err));
      setError(getUserErrorMessage(err, '글 등록에 실패했어요. 잠시 후 다시 시도해 주세요.'));
      setProgress('');
      setPending(false);
    }
  };

  if (authLoading) {
    return <div className={`card ${styles.gate} muted`}>로그인 상태를 확인하는 중…</div>;
  }

  if (!user) {
    return (
      <div className={`card stack ${styles.gate}`}>
        <h2>로그인이 필요해요</h2>
        <p className="muted" style={{ margin: 0 }}>글을 쓰려면 로그인해 주세요.</p>
        <Link className="btn" href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.communityWrite)}`}>로그인하러 가기</Link>
        <Link className="btn btn-outline" href={ROUTES.community}>목록으로</Link>
      </div>
    );
  }

  return (
    <form className={`card stack ${styles.form}`} onSubmit={onSubmit} aria-busy={pending}>
      <div className={styles.field}>
        <span id="board-label">게시판</span>
        <div className={styles.boards} role="group" aria-labelledby="board-label">
          {categories.map((item) => (
            <button
              key={item.code}
              type="button"
              className={categoryCode === item.code ? 'chip on' : 'chip'}
              onClick={() => setCategoryCode(item.code)}
              disabled={pending}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.field} htmlFor="post-title">
        <span style={{ display: 'flex', gap: 8 }}>
          제목
          <span className={`${styles.hint} ${styles.count}`}>{title.length}/{POST_LIMITS.titleMax}</span>
        </span>
        <input
          id="post-title"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, POST_LIMITS.titleMax))}
          maxLength={POST_LIMITS.titleMax}
          placeholder="제목을 입력해 주세요"
          disabled={pending}
          required
        />
      </label>

      <label className={styles.field} htmlFor="post-content">
        <span style={{ display: 'flex', gap: 8 }}>
          내용
          <span className={`${styles.hint} ${styles.count}`}>{content.length}/{POST_LIMITS.contentMax}</span>
        </span>
        <textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, POST_LIMITS.contentMax))}
          maxLength={POST_LIMITS.contentMax}
          placeholder="내용을 입력해 주세요"
          disabled={pending}
          required
        />
      </label>

      <div className={styles.field}>
        <span id="photos-label">사진 첨부</span>
        <p className={styles.hint} style={{ margin: 0 }}>
          JPEG/PNG/WebP, 파일당 5MiB 이하, 최대 {POST_LIMITS.maxImages}장. 선택한 순서로 등록돼요.
        </p>
        <div className={styles.fileRow}>
          <label className="btn btn-outline btn-sm" htmlFor={fileInputId} style={{ cursor: pending ? 'not-allowed' : 'pointer' }}>
            사진 선택
          </label>
          <input
            id={fileInputId}
            type="file"
            accept={POST_LIMITS.imageAccept}
            multiple
            hidden
            disabled={pending || photos.length >= POST_LIMITS.maxImages}
            onChange={onPickFiles}
            aria-labelledby="photos-label"
          />
          <span className={styles.hint}>{photos.length}/{POST_LIMITS.maxImages}</span>
        </div>
        {photos.length > 0 && (
          <div className={styles.previews}>
            {photos.map((photo, index) => (
              <div key={photo.key} className={styles.preview}>
                <img src={photo.previewUrl} alt={`첨부 사진 ${index + 1}`} />
                {photo.uploadedId && <span className={styles.badge}>업로드됨</span>}
                <button type="button" className={styles.remove} onClick={() => removePhoto(photo.key)} disabled={pending}>
                  제거
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="bad small" role="alert" style={{ margin: 0 }}>{error}</p>}
      {needsLogin && (
        <Link
          className="btn btn-outline btn-sm"
          href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.communityWrite)}`}
          style={{ alignSelf: 'flex-start' }}
        >
          로그인하러 가기
        </Link>
      )}
      {progress && <p className="small muted" style={{ margin: 0 }}>{progress}</p>}

      <div className={styles.actions}>
        <Link href={ROUTES.community} className="btn btn-outline">취소</Link>
        <button type="submit" className="btn" disabled={pending}>
          {pending ? '등록 중…' : '등록하기'}
        </button>
      </div>
    </form>
  );
}
