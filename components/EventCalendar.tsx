'use client';

import { useState, useMemo } from 'react';
import type { Event } from '@/app/actions/events';
import Link from 'next/link';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type EventCalendarProps = {
  events: Event[];
};

export default function EventCalendar({ events }: EventCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach((event) => {
      if (!map[event.event_date]) {
        map[event.event_date] = [];
      }
      map[event.event_date].push(event);
    });
    return map;
  }, [events]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];

    // Pad the start with nulls
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [currentMonth, currentYear]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const getDateString = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <div className="event-calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={goToPrevMonth} aria-label="Previous month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h3 className="calendar-month-title">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h3>
        <button className="calendar-nav-btn" onClick={goToNextMonth} aria-label="Next month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day name headers */}
      <div className="calendar-day-names">
        {DAY_NAMES.map((day) => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="calendar-cell calendar-cell-empty" />;
          }

          const dateStr = getDateString(day);
          const hasEvents = !!eventsByDate[dateStr];
          const isSelected = selectedDate === dateStr;
          const isTodayCell = isToday(day);

          return (
            <button
              key={dateStr}
              className={`calendar-cell ${hasEvents ? 'has-events' : ''} ${isSelected ? 'selected' : ''} ${isTodayCell ? 'is-today' : ''}`}
              onClick={() => hasEvents ? setSelectedDate(isSelected ? null : dateStr) : undefined}
              disabled={!hasEvents}
              aria-label={`${MONTH_NAMES[currentMonth]} ${day}${hasEvents ? ' — has events' : ''}`}
            >
              <span className="calendar-cell-day">{day}</span>
              {hasEvents && (
                <span className="calendar-cell-dot" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="calendar-events-panel">
          <h4 className="calendar-events-date">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </h4>

          {selectedEvents.length === 0 ? (
            <p className="calendar-no-events">No events on this date.</p>
          ) : (
            <div className="calendar-events-list">
              {selectedEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="calendar-event-card"
                >
                  <div className="calendar-event-time">
                    {formatTime(event.start_time)} — {formatTime(event.end_time)}
                  </div>
                  <h5 className="calendar-event-title">{event.title}</h5>
                  {event.venue && (
                    <p className="calendar-event-venue">📍 {event.venue}</p>
                  )}
                  <div className="calendar-event-footer">
                    <span className="calendar-event-price">
                      {event.ticket_price > 0
                        ? `$${event.ticket_price.toFixed(2)}`
                        : 'Free'}
                    </span>
                    <span className="calendar-event-availability">
                      {event.capacity - event.tickets_sold > 0
                        ? `${event.capacity - event.tickets_sold} spots left`
                        : 'Sold Out'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
