// src/api/user.js

import { apiFetch } from './client';

// 로그인한 사용자 프로필 조회
export async function getMyProfile() {
  return apiFetch('/api/v1/users/me');
}

// 로그인한 사용자 닉네임 수정
// BE의 PATCH 구현이 완료된 후 사용
export async function updateMyProfile(nickname) {
  return apiFetch('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ nickname }),
  });
}