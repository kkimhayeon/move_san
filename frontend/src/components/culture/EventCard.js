'use client';

import {
  eventImageBadge,
  formatCultureCardMeta,
  safeHttpUrl,
} from '@/utils/culture';
import { categoryLabel } from '@/constants/culture';
import CultureMedia from './CultureMedia';
import styles from './CultureLife.module.css';

/**
 * @param {{ event: object, variant?: 'poster' | 'program' }} props
 */
export default function EventCard({ event, variant = 'poster' }) {
  const cat = categoryLabel(event.category);
  const badge = eventImageBadge(event);
  const meta = formatCultureCardMeta({
    start: event.start_date,
    end: event.end_date,
    place: event.place_name,
    district: event.district,
  });
  const href = safeHttpUrl(event.link_url);
  const Wrapper = href ? 'a' : 'article';
  const wrapperProps = href
    ? {
      href,
      target: '_blank',
      rel: 'noopener noreferrer',
      className: `${styles.eventCard} ${styles.msCard}`,
    }
    : { className: styles.eventCard };

  return (
    <Wrapper {...wrapperProps}>
      <CultureMedia
        imagePath={event.image_path}
        alt={event.title || ''}
        credit={event.image_credit}
        badge={badge}
        badgeTone="light"
        fit="cover"
        ratio={variant === 'program' ? 'wide' : 'poster'}
      />
      <div className={styles.eventText}>
        {cat ? <span className={styles.eventCat}>{cat}</span> : null}
        <span className={styles.eventTitle}>{event.title}</span>
        {event.summary ? <span className={styles.eventLine}>{event.summary}</span> : null}
        {meta ? <span className={styles.eventMetaLine}>{meta}</span> : null}
      </div>
    </Wrapper>
  );
}
