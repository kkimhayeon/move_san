'use client';

import {
  formatCultureDateRange,
  scheduleStatusLabel,
} from '@/utils/culture';
import { OPEN_CATEGORIES } from '@/constants/culture';
import CultureMedia from './CultureMedia';
import styles from './CultureLife.module.css';

const STATUS_CLASS = {
  upcoming: styles.status_upcoming,
  ongoing: styles.status_ongoing,
  ended: styles.status_ended,
  unknown: styles.status_unknown,
};

function categoryLabel(code) {
  if (!code) return null;
  const found = OPEN_CATEGORIES.find((c) => c.value === code);
  if (found) return found.label;
  return code.replace(/_/g, ' ');
}

/**
 * @param {{ event: object }} props
 */
export default function EventCard({ event }) {
  const status = event.schedule_status || 'unknown';
  const statusLabel = scheduleStatusLabel(status);
  const dateText = formatCultureDateRange(event.start_date, event.end_date);
  const place = event.place_name || event.district;
  const cat = categoryLabel(event.category);
  const note = event.schedule_note;
  const override = event.badge_override;
  const statusClass = STATUS_CLASS[status] || STATUS_CLASS.unknown;

  return (
    <article className={styles.eventCard}>
      <CultureMedia
        imagePath={event.image_path}
        alt=""
        credit={event.image_credit}
      />
      <div className={styles.eventBody}>
        <div className={styles.eventBadges}>
          <span className={`${styles.statusPill} ${statusClass}`}>
            {statusLabel}
          </span>
          {cat ? <span className="tag">{cat}</span> : null}
          {override && status !== 'ended' ? (
            <span className={styles.softPill}>{override}</span>
          ) : null}
          {override && status === 'ended' ? (
            <span className={styles.softPillMuted}>{override}</span>
          ) : null}
        </div>
        <h3 className={styles.eventTitle}>{event.title}</h3>
        {event.summary ? <p className={styles.eventSummary}>{event.summary}</p> : null}
        <dl className={styles.eventMeta}>
          {place ? (
            <div>
              <dt>장소</dt>
              <dd>{place}</dd>
            </div>
          ) : null}
          {dateText ? (
            <div>
              <dt>일정</dt>
              <dd>{dateText}</dd>
            </div>
          ) : null}
          {note ? (
            <div>
              <dt>안내</dt>
              <dd>{note}</dd>
            </div>
          ) : null}
        </dl>
        {event.link_url ? (
          <a
            className="btn btn-outline btn-sm"
            href={event.link_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            원문 보기 ↗
          </a>
        ) : null}
      </div>
    </article>
  );
}
