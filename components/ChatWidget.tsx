'use client';

import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  Grid2X2,
  Mail,
  MessageCircle,
  Store,
  Ticket,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type FaqGroup = 'Plan a visit' | 'Join the show';

type Faq = {
  id: string;
  group: FaqGroup;
  label: string;
  question: string;
  answer: string;
  action: {
    href: string;
    label: string;
  };
  icon: LucideIcon;
};

const FAQS: Faq[] = [
  {
    id: 'events',
    group: 'Plan a visit',
    label: 'Upcoming events',
    question: 'When is the next event?',
    answer:
      'Open the event calendar for confirmed show dates, venues, opening times, and ticket availability.',
    action: { href: '/events', label: 'View event calendar' },
    icon: CalendarDays,
  },
  {
    id: 'tickets',
    group: 'Plan a visit',
    label: 'Tickets',
    question: 'How do I get tickets?',
    answer:
      'Choose an upcoming event and use its booking link. Availability and entry options are shown on each event page.',
    action: { href: '/events', label: 'Find tickets' },
    icon: Ticket,
  },
  {
    id: 'refund',
    group: 'Plan a visit',
    label: 'Refund policy',
    question: 'What is the refund policy?',
    answer:
      'Refund and transfer terms can vary by event. Check the terms shown during booking, or email us about a specific ticket.',
    action: {
      href: 'mailto:hello@collectorsparadise.au?subject=Ticket%20refund%20enquiry',
      label: 'Ask about a ticket',
    },
    icon: CircleDollarSign,
  },
  {
    id: 'grading',
    group: 'Plan a visit',
    label: 'Card grading',
    question: 'Is there card grading at events?',
    answer:
      'Selected shows may include card evaluation or grading services. Check the event details before travelling to confirm what is available.',
    action: { href: '/events', label: 'Check event services' },
    icon: BadgeCheck,
  },
  {
    id: 'vendor',
    group: 'Join the show',
    label: 'Vendor applications',
    question: 'How do I become a vendor?',
    answer:
      'Send one application for the events you want to attend. We review your business details and contact you about each selected show.',
    action: { href: '/vendors/apply', label: 'Apply as a vendor' },
    icon: Store,
  },
  {
    id: 'collections',
    group: 'Join the show',
    label: 'Vendor collections',
    question: 'How do I share a collection?',
    answer:
      'Collection publishing is available to approved vendors. Email support if you need help accessing or updating your vendor content.',
    action: {
      href: 'mailto:hello@collectorsparadise.au?subject=Vendor%20collection%20support',
      label: 'Email vendor support',
    },
    icon: Grid2X2,
  },
  {
    id: 'contact',
    group: 'Join the show',
    label: 'Contact support',
    question: 'How do I contact you?',
    answer:
      'File a support report and our team will receive the details with a ticket reference you can keep.',
    action: { href: '/reports', label: 'File a support report' },
    icon: Mail,
  },
];

const FAQ_GROUPS: FaqGroup[] = ['Plan a visit', 'Join the show'];

const CHAT_PROMPTS = [
  'Got an issue?',
  'Want to know upcoming events?',
  'How to apply as a vendor?',
  'Need help?',
] as const;

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [selectedFaqId, setSelectedFaqId] = useState<string | null>(null);
  const dialogId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const selectedFaq = FAQS.find((faq) => faq.id === selectedFaqId) ?? null;
  const reportsHref = `/reports?from=${encodeURIComponent(pathname)}`;

  const closeChat = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const openChat = () => {
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const promptTimer = window.setInterval(() => {
      setPromptIndex((currentIndex) => (currentIndex + 1) % CHAT_PROMPTS.length);
    }, 3600);

    return () => window.clearInterval(promptTimer);
  }, [isOpen]);

  const selectFaq = (faqId: string) => {
    setSelectedFaqId(faqId);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.requestAnimationFrame(() => {
      bodyRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
    }, 0);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeChat();
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeChat, isOpen]);

  return (
    <div className={`chat-widget-container ${isOpen ? 'is-open' : ''}`}>
      <div className="widget-triggers">
        {!isOpen && (
          <button
            type="button"
            className="chat-trigger-label"
            onClick={openChat}
            aria-label={`Open support chat: ${CHAT_PROMPTS[promptIndex]}`}
          >
            <span key={CHAT_PROMPTS[promptIndex]}>{CHAT_PROMPTS[promptIndex]}</span>
          </button>
        )}
        <button
          ref={triggerRef}
          type="button"
          className="pokeball-widget"
          onClick={isOpen ? closeChat : openChat}
          aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
          aria-expanded={isOpen}
          aria-controls={dialogId}
        >
          <span className="poke-top" aria-hidden="true" />
          <span className="poke-bottom" aria-hidden="true" />
          <span className="poke-center" aria-hidden="true">
            <span className="poke-button" />
          </span>
        </button>
      </div>

      <section
        id={dialogId}
        className="chat-window"
        role="dialog"
        aria-modal="false"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-description`}
        aria-hidden={!isOpen}
      >
        <header className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-avatar" aria-hidden="true">CP</div>
            <div className="chat-header-copy">
              <h2 id={`${dialogId}-title`}>How can we help?</h2>
              <p id={`${dialogId}-description`}>Quick answers for event visitors</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="chat-icon-button"
            onClick={closeChat}
            aria-label="Close support chat"
          >
            <X size={19} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </header>

        <div className="chat-body" ref={bodyRef} data-lenis-prevent data-lenis-prevent-touch>
          {selectedFaq ? (
            <div className="chat-answer-view" aria-live="polite">
              <button
                type="button"
                className="chat-back-button"
                onClick={() => setSelectedFaqId(null)}
              >
                <ChevronLeft size={16} strokeWidth={2.25} aria-hidden="true" />
                All help topics
              </button>

              <div className="chat-message chat-message--user">
                <div className="chat-bubble">{selectedFaq.question}</div>
              </div>

              <div className="chat-message chat-message--bot">
                <div className="chat-bot-avatar" aria-hidden="true">CP</div>
                <div className="chat-answer-card">
                  <h3>{selectedFaq.label}</h3>
                  <p>{selectedFaq.answer}</p>
                  <a className="chat-answer-action" href={selectedFaq.id === 'contact' ? reportsHref : selectedFaq.action.href}>
                    {selectedFaq.action.label}
                    <ArrowUpRight size={16} strokeWidth={2.25} aria-hidden="true" />
                  </a>
                </div>
              </div>

              <button
                type="button"
                className="chat-secondary-action"
                onClick={() => setSelectedFaqId(null)}
              >
                Ask another question
              </button>
            </div>
          ) : (
            <div className="chat-start-view">
              <div className="chat-welcome">
                <MessageCircle size={20} strokeWidth={2.1} aria-hidden="true" />
                <p>Select a topic and we will point you to the right place.</p>
              </div>

              {FAQ_GROUPS.map((group) => (
                <div className="chat-topic-group" key={group}>
                  <h3>{group}</h3>
                  <div className="chat-topic-list">
                    {FAQS.filter((faq) => faq.group === group).map((faq) => {
                      const Icon = faq.icon;

                      return (
                        <button
                          type="button"
                          key={faq.id}
                          className="chat-topic-button"
                          onClick={() => selectFaq(faq.id)}
                        >
                          <span className="chat-topic-icon" aria-hidden="true">
                            <Icon size={17} strokeWidth={2.1} />
                          </span>
                          <span>{faq.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <a className="chat-email-link" href={reportsHref}>
                Still need help? File a support report
              </a>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
