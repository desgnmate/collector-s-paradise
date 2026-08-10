'use client';

import { useMemo, useState } from 'react';
import { CONTACT_EMAIL } from '@/lib/site';
import styles from './accessibility.module.css';

const supportTopics = [
  ['step-free', 'Step-free route or mobility access'],
  ['seating', 'Seating or rest-break information'],
  ['quieter', 'Quieter arrival or lower-crowd timing'],
  ['companion', 'Companion or support-person information'],
  ['toilets', 'Accessible toilet information'],
  ['dietary', 'Food, allergy, or dietary information'],
];

export default function AccessPlanner() {
  const [selected, setSelected] = useState<string[]>([]);
  const [eventName, setEventName] = useState('');
  const [notes, setNotes] = useState('');

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const emailHref = useMemo(() => {
    const labels = supportTopics.filter(([id]) => selected.includes(id)).map(([, label]) => `- ${label}`);
    const body = [
      `Event: ${eventName || 'Please add the event name or city'}`,
      '',
      'I would like venue-specific information about:',
      ...(labels.length ? labels : ['- General event accessibility']),
      '',
      `Additional context: ${notes || 'None added'}`,
      '',
      'I understand that facilities and available adjustments vary by venue and require confirmation.',
    ].join('\n');

    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Accessibility question${eventName ? ` — ${eventName}` : ''}`)}&body=${encodeURIComponent(body)}`;
  }, [eventName, notes, selected]);

  return (
    <div className={styles.planner}>
      <div className={styles.plannerIntro}>
        <p>Optional email builder</p>
        <h2>Prepare an access question</h2>
        <span>Choose what you need information about. This creates an email draft; it does not book or guarantee an adjustment.</span>
      </div>
      <div className={styles.plannerForm}>
        <label className={styles.textField}>
          <span>Event name or city</span>
          <input value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="e.g. Canberra event" />
        </label>
        <fieldset className={styles.topicFieldset}>
          <legend>What would you like us to check?</legend>
          <div className={styles.topicGrid}>
            {supportTopics.map(([id, label]) => {
              const isSelected = selected.includes(id);
              return (
                <label key={id} className={`${styles.topic} ${isSelected ? styles.topicSelected : ''}`}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggle(id)} />
                  <span aria-hidden="true">{isSelected ? '✓' : ''}</span>
                  <strong>{label}</strong>
                </label>
              );
            })}
          </div>
        </fieldset>
        <label className={styles.textField}>
          <span>Anything else we should understand?</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Describe the information or arrangement you want the team to check." />
        </label>
        <div className={styles.plannerFooter}>
          <p>Your email app will open with this information. Review it before sending.</p>
          <a href={emailHref} className={styles.emailButton}>Create email to {CONTACT_EMAIL}</a>
        </div>
      </div>
    </div>
  );
}
