import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ... (FAQ data stays same)
const FAQS = [
  // ... (keep original FAQ content)
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
    answer: "Only approved vendors can post collections. Once your vendor application is approved, head to the Collections page and click 'Post a Collection' to share your cards with the community.",
  },
  {
    id: 'contact',
    question: 'How do I contact you?',
    answer: "You can reach us at hello@collectorsparadise.com.au. We typically respond within 1–2 business days. For urgent event enquiries, please email us directly.",
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
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: "👋 Hi there! Welcome to Collector's Paradise. What can I help you with today?" },
  ]);
  const [answered, setAnswered] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  
  const bodyRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Set default volume level and load persisted state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.7;
    }
    
    // Check if music should be active (default to true if not set)
    const savedActive = localStorage.getItem('cp_music_active');
    const shouldBeActive = savedActive === null || savedActive === 'true';
    
    if (shouldBeActive && isHomepage) {
      const attemptPlay = () => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              localStorage.setItem('cp_music_active', 'true');
            })
            .catch(() => {
            });
        }
      };
      
      // Small delay to ensure audio ref is ready
      const timer = setTimeout(attemptPlay, 500);
      return () => clearTimeout(timer);
    }
  }, [isHomepage]);

  // Detect if Hero section is in view
  useEffect(() => {
    if (!isHomepage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const heroElement = document.getElementById('hero');
    if (heroElement) {
      observer.observe(heroElement);
    }

    return () => {
      if (heroElement) observer.unobserve(heroElement);
    };
  }, [isHomepage]);

  // Auto-pause/resume logic based on visibility
  useEffect(() => {
    if (!isHomepage || !audioRef.current) return;

    if (!isHeroVisible && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (isHeroVisible && !isPlaying) {
      const savedActive = localStorage.getItem('cp_music_active');
      if (savedActive === null || savedActive === 'true') {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [isHeroVisible, isHomepage, isPlaying]);

  // Autoplay logic - Browser requires interaction
  useEffect(() => {
    if (!isHomepage) return;

    const startAudio = () => {
      // If we already know music should be active, or it's the first visit
      if (audioRef.current && !isPlaying && isHeroVisible) {
        const savedActive = localStorage.getItem('cp_music_active');
        if (savedActive === null || savedActive === 'true') {
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              localStorage.setItem('cp_music_active', 'true');
              // Once playing, remove listeners
              document.removeEventListener('click', startAudio);
              document.removeEventListener('touchstart', startAudio);
            })
            .catch(() => {});
        }
      }
    };

    // Add listeners to catch the very first interaction
    document.addEventListener('click', startAudio);
    document.addEventListener('touchstart', startAudio);

    return () => {
      document.removeEventListener('click', startAudio);
      document.removeEventListener('touchstart', startAudio);
    };
  }, [isHomepage, isPlaying]);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        localStorage.setItem('cp_music_active', 'false');
      } else {
        audioRef.current.play()
          .then(() => {
            localStorage.setItem('cp_music_active', 'true');
          })
          .catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

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
        {/* Background Music Toggle (Homepage Hero only) */}
        {isHomepage && isHeroVisible && (
          <>
            <audio ref={audioRef} src="/audio/bg-music.mp3" loop />
            <button 
              className={`music-widget-toggle ${isPlaying ? 'playing' : ''}`}
              onClick={toggleMusic}
              aria-label={isPlaying ? "Mute music" : "Play music"}
              title={isPlaying ? "Mute music" : "Play music"}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
              )}
            </button>
          </>
        )}

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
