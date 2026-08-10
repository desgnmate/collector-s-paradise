'use client';

import { useState } from 'react';
import styles from './guide.module.css';

const checklistItems = [
  { id: 'event', title: 'Re-check the event listing', detail: 'Confirm the published date, venue, times, and ticket link.' },
  { id: 'budget', title: 'Set a comfortable limit', detail: 'Decide what you can spend or trade before you enter the room.' },
  { id: 'want-list', title: 'Make a short want list', detail: 'Save set names, card numbers, players, or characters you are looking for.' },
  { id: 'protection', title: 'Pack card protection', detail: 'Bring sleeves, top loaders, a secure binder, or a compact storage box.' },
  { id: 'trade', title: 'Separate trade items', detail: 'Make it obvious which cards are available and which are not for trade.' },
  { id: 'access', title: 'Raise access questions', detail: 'Contact the team early if you need venue-specific accessibility information.' },
];

export default function FirstShowChecklist() {
  const [checked, setChecked] = useState<string[]>([]);
  const percent = Math.round((checked.length / checklistItems.length) * 100);

  const toggle = (id: string) => {
    setChecked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <div className={styles.checklistPanel}>
      <div className={styles.checklistTopline}>
        <div>
          <p>Interactive packing check</p>
          <h2>Ready for your first lap?</h2>
        </div>
        <div className={styles.progressBadge} aria-live="polite">
          <strong>{percent}%</strong><span>prepared</span>
        </div>
      </div>

      <div className={styles.progressTrack} aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>

      <div className={styles.checklistItems}>
        {checklistItems.map((item) => {
          const isChecked = checked.includes(item.id);
          return (
            <label key={item.id} className={`${styles.checkItem} ${isChecked ? styles.checkItemDone : ''}`}>
              <input type="checkbox" checked={isChecked} onChange={() => toggle(item.id)} />
              <span className={styles.customCheck} aria-hidden="true">{isChecked ? '✓' : ''}</span>
              <span><strong>{item.title}</strong><small>{item.detail}</small></span>
            </label>
          );
        })}
      </div>

      {checked.length > 0 && (
        <button type="button" className={styles.resetButton} onClick={() => setChecked([])}>
          Reset checklist
        </button>
      )}
    </div>
  );
}
