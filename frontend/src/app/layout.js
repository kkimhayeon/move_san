import './globals.css';
import { ComparisonHydration } from '@/stores/comparison';
import Header from '@/components/layout/Header';
import { AuthProvider } from '@/components/layout/AuthProvider';
import Footer from '@/components/layout/Footer';
import AiChatLazy from '@/components/layout/AiChatLazy';
import ScrollToTop from '@/components/layout/ScrollToTop';
import NavigationProgress from '@/components/layout/NavigationProgress';
import { CHATBOT_ENABLED } from '@/constants/features';
import { SITE } from '@/constants/seo';

const verification = {};
if (process.env.GOOGLE_SITE_VERIFICATION) verification.google = process.env.GOOGLE_SITE_VERIFICATION;
if (process.env.NAVER_SITE_VERIFICATION) {
  verification.other = { 'naver-site-verification': process.env.NAVER_SITE_VERIFICATION };
}

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  robots: { index: true, follow: true },
  ...(Object.keys(verification).length > 0 ? { verification } : {}),
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <AuthProvider>
        <ComparisonHydration />
        <NavigationProgress />
        <Header />
        <main className="main">{children}</main>
        <Footer />
        <ScrollToTop />
        {CHATBOT_ENABLED ? <AiChatLazy /> : null}
        </AuthProvider>
      </body>
    </html>
  );
}
