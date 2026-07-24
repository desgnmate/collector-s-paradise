'use client';

import { useState } from 'react';

type FaqItem = {
  q: string;
  a: string;
};

interface FaqAccordionProps {
  items: readonly FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="faq-list">
      {items.map((faq, index) => {
        const isOpen = openIndex === index;
        const answerId = `faq-answer-${index}`;

        return (
          <article className={`faq-item ${isOpen ? 'is-open' : ''}`} key={faq.q}>
            <button
              type="button"
              className="faq-question"
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <span className="faq-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="faq-question-text">{faq.q}</span>
              <span className="faq-toggle-icon" aria-hidden="true" />
            </button>

            {isOpen && (
              <div className="faq-answer-wrap" id={answerId}>
                <p className="faq-answer">{faq.a}</p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
