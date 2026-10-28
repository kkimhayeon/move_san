import { createClient } from '@/lib/supabase/client';

// 로그인
export async function signIn(email, password) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

// 로그아웃
export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}


// 회원가입
export async function signUp(email, password) {
  const supabase = createClient();
  const normalizedEmail = email.trim();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        nickname: normalizedEmail.split('@')[0],
      },
    },
  });

  if (error) throw error;

  return data;
}