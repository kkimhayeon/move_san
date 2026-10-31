'use client';

import dynamic from 'next/dynamic';
import { CHATBOT_ENABLED } from '@/constants/features';

const AiChat = dynamic(() => import('./AiChat'), {
  ssr: false,
});

export default function AiChatLazy() {
  if (!CHATBOT_ENABLED) return null;
  return <AiChat />;
}
