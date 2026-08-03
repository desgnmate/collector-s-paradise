export type EventStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export function getLocalDateKey(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Past date wins over stale DB status; cancelled remains cancelled. */
export function getEffectiveEventStatus(
  event: { event_date: string; status: EventStatus },
  today = getLocalDateKey(),
): EventStatus {
  return event.event_date < today && event.status !== 'cancelled'
    ? 'completed'
    : event.status;
}
