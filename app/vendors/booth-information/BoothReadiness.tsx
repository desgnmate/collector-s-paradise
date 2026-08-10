'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './booth.module.css';

const readinessItems = [
  ['identity', 'Business identity', 'A business name, contact details, location, and a clear public-facing profile.'],
  ['range', 'Product range', 'A concise list of the card games, collectibles, art, or accessories you plan to offer.'],
  ['visual', 'Logo or avatar', 'A current image that can represent your booth in the vendor directory.'],
  ['event', 'Event selection', 'The published show dates you want to apply for, checked against your availability.'],
  ['notes', 'Practical requests', 'Any setup or access questions that the team should review for the selected venue.'],
];

export default function BoothReadiness() {
  const [ready, setReady] = useState<string[]>([]);
  const completed = ready.length === readinessItems.length;

  const toggle = (id: string) => {
    setReady((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <div className={styles.readinessTool}>
      <div className={styles.toolHeader}>
        <span>Application pre-check</span>
        <strong aria-live="polite">{ready.length} / {readinessItems.length} ready</strong>
      </div>
      <div className={styles.toolBody}>
        <h2>Do you have the essentials?</h2>
        <p>Use this quick check before opening the application. It does not submit or reserve a booth.</p>
        <div className={styles.readinessList}>
          {readinessItems.map(([id, title, detail]) => {
            const isReady = ready.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={`${styles.readinessItem} ${isReady ? styles.readinessItemActive : ''}`}
                onClick={() => toggle(id)}
                aria-pressed={isReady}
              >
                <span className={styles.readinessMark} aria-hidden="true">{isReady ? '✓' : '+'}</span>
                <span><strong>{title}</strong><small>{detail}</small></span>
              </button>
            );
          })}
        </div>
        <div className={styles.toolFooter}>
          <p>{completed ? 'Your preparation list is complete. You can still review the live opportunities below before applying.' : 'Tick each item as you prepare it. You can apply before every item is perfect and explain practical questions in your notes.'}</p>
          <Link href="/vendors/apply" className={styles.yellowButton}>Open vendor application</Link>
        </div>
      </div>
    </div>
  );
}
