'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './LoadingScreen.module.css';

const SESSION_KEY    = 'cp_loaded';
const MIN_DISPLAY_MS = 2000;
const TIMEOUT_MS     = 8000;
const EXIT_SAFETY_MS = 700;

// Cards scattered across the screen — each drifts slowly upward or downward
// with a slight rotation. Positions are in % of viewport.
const FLOAT_CARDS = [
  { left: '5%',  top: '15%', tilt: '-12deg', spin: '-6deg',  duration: '7s',  delay: '0s',    drift: '-80px', opacity: 0.55, shimmerDelay: '0s'    },
  { left: '18%', top: '65%', tilt: '8deg',   spin: '5deg',   duration: '9s',  delay: '0.8s',  drift: '-100px',opacity: 0.45, shimmerDelay: '0.6s'  },
  { left: '30%', top: '10%', tilt: '-5deg',  spin: '8deg',   duration: '8s',  delay: '1.5s',  drift: '-90px', opacity: 0.6,  shimmerDelay: '1.2s'  },
  { left: '42%', top: '75%', tilt: '15deg',  spin: '-10deg', duration: '10s', delay: '0.3s',  drift: '-70px', opacity: 0.4,  shimmerDelay: '0.4s'  },
  { left: '55%', top: '8%',  tilt: '-18deg', spin: '7deg',   duration: '7.5s',delay: '2s',    drift: '-85px', opacity: 0.5,  shimmerDelay: '1.8s'  },
  { left: '68%', top: '60%', tilt: '6deg',   spin: '-5deg',  duration: '9.5s',delay: '0.5s',  drift: '-95px', opacity: 0.55, shimmerDelay: '0.9s'  },
  { left: '78%', top: '20%', tilt: '-10deg', spin: '12deg',  duration: '8.5s',delay: '1.2s',  drift: '-75px', opacity: 0.45, shimmerDelay: '0.3s'  },
  { left: '88%', top: '70%', tilt: '20deg',  spin: '-8deg',  duration: '7s',  delay: '0.7s',  drift: '-110px',opacity: 0.5,  shimmerDelay: '1.5s'  },
  { left: '12%', top: '40%', tilt: '3deg',   spin: '6deg',   duration: '11s', delay: '1.8s',  drift: '-60px', opacity: 0.35, shimmerDelay: '2.1s'  },
  { left: '60%', top: '40%', tilt: '-8deg',  spin: '-4deg',  duration: '8s',  delay: '2.5s',  drift: '-80px', opacity: 0.4,  shimmerDelay: '0.7s'  },
  { left: '92%', top: '35%', tilt: '14deg',  spin: '9deg',   duration: '9s',  delay: '1s',    drift: '-90px', opacity: 0.5,  shimmerDelay: '1.1s'  },
  { left: '48%', top: '88%', tilt: '-6deg',  spin: '-7deg',  duration: '10s', delay: '0.2s',  drift: '-70px', opacity: 0.45, shimmerDelay: '0.5s'  },
] as const;

function getSessionFlag(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
}
function setSessionFlag() {
  try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
}

export default function LoadingScreen() {
  const [visible,  setVisible]  = useState(true);
  const [exiting,  setExiting]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  const exitStartedRef = useRef(false);

  const [skip] = useState(getSessionFlag);

  const triggerExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;
    setProgress(100);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setExiting(true);
      setTimeout(() => { setVisible(false); setSessionFlag(); }, EXIT_SAFETY_MS);
    }));
  }, []);

  useEffect(() => {
    if (skip) { setVisible(false); return; }

    // Progress ticker — fills to 100% over MIN_DISPLAY_MS
    const tickInterval = 50;
    const totalTicks = MIN_DISPLAY_MS / tickInterval;
    let tick = 0;
    const ticker = setInterval(() => {
      tick++;
      const pct = Math.min(Math.round((tick / totalTicks) * 100), 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(ticker);
      }
    }, tickInterval);

    // Exit after MIN_DISPLAY_MS — unconditional, no ready-state dependency
    const exitTimer = setTimeout(() => {
      triggerExit();
    }, MIN_DISPLAY_MS);

    // Timeout fallback label
    const timeoutTimer = setTimeout(() => setTimedOut(true), TIMEOUT_MS);

    return () => {
      clearInterval(ticker);
      clearTimeout(exitTimer);
      clearTimeout(timeoutTimer);
    };
  }, [skip, triggerExit]);

  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.propertyName === 'opacity' && exiting) {
      setVisible(false);
      setSessionFlag();
    }
  }, [exiting]);

  if (skip || !visible) return null;

  const pct = Math.round(progress);

  return (
    <>
      <div
        aria-live="polite"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      >
        Loading Collector&apos;s Paradise
      </div>

      <div
        aria-label="Loading screen"
        className={`${styles.overlay}${exiting ? ` ${styles.exiting}` : ''}`}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Floating cards background */}
        <div className={styles.cardsBg}>
          {FLOAT_CARDS.map((c, i) => (
            <div
              key={i}
              className={styles.floatCard}
              style={{
                '--left':          c.left,
                '--top':           c.top,
                '--tilt':          c.tilt,
                '--spin':          c.spin,
                '--duration':      c.duration,
                '--delay':         c.delay,
                '--drift':         c.drift,
                '--opacity':       c.opacity,
                '--shimmer-delay': c.shimmerDelay,
                left:              c.left,
                top:               c.top,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Center: logo + progress */}
        <div className={styles.center}>
          <div className={styles.logoWrap}>
            <Image
              src="/images/logo.png"
              alt="Collector's Paradise"
              width={200}
              height={62}
              priority
              style={{ width: 'auto', height: 'auto', maxWidth: '200px' }}
            />
          </div>

          <div className={styles.progressWrap}>
            <span className={styles.progressLabel}>
              {timedOut ? 'TAKING LONGER THAN EXPECTED…' : 'LOADING…'}
            </span>
            <div className={styles.progressTrack}>
              <div
                role="progressbar"
                aria-label="Loading progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                className={styles.progressFill}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
