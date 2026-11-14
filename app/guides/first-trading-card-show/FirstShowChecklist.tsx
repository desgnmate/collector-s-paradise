'use client';

import { useState } from 'react';
import styles from './guide.module.css';

const checklistItems = [
  { id: 'event', title: 'Event details', detail: 'Re-check the date, venue, times and ticket link.' },
  { id: 'budget', title: 'A limit', detail: 'Decide what you can spend or trade before you walk in.' },
  { id: 'want-list', title: 'Your want list', detail: 'Set names, card numbers, players or characters.' },
  { id: 'protection', title: 'Card protection', detail: 'Sleeves, top loaders, a secure binder or a small box.' },
  { id: 'trade', title: 'Trades, kept separate', detail: 'So it’s obvious what’s available and what isn’t.' },
  { id: 'access', title: 'Access questions', detail: 'Contact the team early if you need venue accessibility details.' },
];

export default function FirstShowChecklist() {
  const [checked, setChecked] = useState<string[]>([]);
  const allDone = checked.length === checklistItems.length;

  const toggle = (id: string) => {
    setChecked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <>
      <div className={styles.packHead}>
        <h2 id="pack-title"><span>02</span>What to pack</h2>
        <p className={styles.packCount} aria-live="polite">
          {checked.length}/{checklistItems.length} <span>{allDone ? 'packed' : 'packed so far'}</span>
        </p>
      </div>
      <p className={styles.packNote}>Tick them off as you go. Nothing is saved, it&apos;s just for you.</p>
      <ul className={styles.checklist}>
        {checklistItems.map((item) => {
          const isChecked = checked.includes(item.id);
          return (
            <li key={item.id}>
              <label className={`${styles.checkItem} ${isChecked ? styles.checkItemDone : ''}`}>
                <input type="checkbox" checked={isChecked} onChange={() => toggle(item.id)} />
                <span className={styles.checkBox} aria-hidden="true">
                  {isChecked && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </span>
                <span className={styles.checkTitle}>{item.title}</span>
                <span className={styles.checkDetail}>{item.detail}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </>
  );
}
