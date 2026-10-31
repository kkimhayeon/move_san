import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';
import SignupForm from './SignupForm';
import styles from '../login/auth.module.css';

export const metadata = pageMeta({
  title: '회원가입',
  description: '무브산 회원가입 화면입니다.',
  path: ROUTES.signup,
  index: false,
});

export default function SignupPage() {
  return (
    <div className={`page ${styles.page}`}>
      <SignupForm />
    </div>
  );
}