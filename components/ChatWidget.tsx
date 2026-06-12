'use client';

import React, { useState, useRef, useEffect } from 'react';

const FAQS = [
  {
    id: 'events',
    question: 'When is the next event?',
    answer: "Our next event is coming up soon! Head to the Events page to see all upcoming shows, dates, venues, and ticket availability.",
  },
  {
    id: 'tickets',
    question: 'How do I get tickets?',
    answer: "You can purchase tickets directly on our Events page. Click on any upcoming event and follow the booking steps. Tickets are limited so grab yours early!",
  },
  {
    id: 'vendor',
    question: 'How do I become a vendor?',
    answer: "We'd love to have you! Visit the Vendors page and click 'Apply as Vendor'. Fill in your business details and we'll review your application. Approved vendors get a booth at our events.",
  },
  {
    id: 'collections',
    question: 'How do I post a collection?',
    answer: "Vendors can share their cards via the Vendor Dashboard after approval.",
  },
  {
    id: 'contact',
    question: 'How do I contact you?',
    answer: "You can reach us at hello@collectorsparadise.au. We typically respond within 1–2 business days. For urgent event enquiries, please email us directly.",
  },
  {
    id: 'refund',
    question: 'What is the refund policy?',
    answer: "Refund policies vary per event and are outlined at the time of ticket purchase. Generally, tickets are non-refundable but may be transferable. Contact us if you have a specific situation.",
  },
  {
    id: 'grading',
    question: 'Is there card grading at events?',
    answer: "Yes! We offer live PSA card evaluation sessions at select events. Check the event details page for the specific services available at each show.",
  },
];

type Message = {
  from: 'bot' | 'user';
  text: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: "👋 Hi there! Welcome to Collector's Paradise. What can I help you with today?" },
  ]);
  const [answered, setAnswered] = useState<string[]>([]);
  
  const bodyRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleQuestion = (faq: typeof FAQS[0]) => {
    setMessages(prev => [
      ...prev,
      { from: 'user', text: faq.question },
      { from: 'bot', text: faq.answer },
    ]);
    setAnswered(prev => [...prev, faq.id]);
  };

  const handleReset = () => {
    setMessages([{ from: 'bot', text: "👋 Hi there! Welcome to Collector's Paradise. What can I help you with today?" }]);
    setAnswered([]);
  };

  const remaining = FAQS.filter(f => !answered.includes(f.id));

  return (
    <div className={`chat-widget-container ${isOpen ? 'is-open' : ''}`}>
      {/* Chat Window */}
      <div className="chat-window">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-avatar">CP</div>
            <div>
              <h3>Collector Support</h3>
              <span className="chat-header-status">● Online</span>
            </div>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">×</button>
        </div>

        {/* Messages */}
        <div className="chat-body" ref={bodyRef} data-lenis-prevent data-lenis-prevent-touch>
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message chat-message--${msg.from}`}>
              {msg.from === 'bot' && <div className="chat-bot-avatar">CP</div>}
              <div className="chat-bubble">{msg.text}</div>
            </div>
          ))}

          {/* Question buttons */}
          {remaining.length > 0 && (
            <div className="chat-questions">
              <p className="chat-questions-label">Choose a question:</p>
              {remaining.map(faq => (
                <button
                  key={faq.id}
                  className="chat-question-btn"
                  onClick={() => handleQuestion(faq)}
                >
                  {faq.question}
                </button>
              ))}
            </div>
          )}

          {remaining.length === 0 && (
            <div className="chat-all-answered">
              <p>You've covered all the common questions!</p>
              <button className="chat-reset-btn" onClick={handleReset}>Start over</button>
            </div>
          )}
        </div>
      </div>

      <div className="widget-triggers">
        {/* Pokéball trigger */}
        <div className="pokeball-widget" onClick={() => setIsOpen(!isOpen)} role="button" aria-label="Open support chat">
          <div className="poke-top" />
          <div className="poke-bottom" />
          <div className="poke-center">
            <div className="poke-button" />
          </div>
        </div>
      </div>
    </div>
  );
}
