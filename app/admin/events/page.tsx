import { getAdminEvents } from '@/app/actions/events';
import AdminEventsClient from './AdminEventsClient';

export default async function AdminEventsPage() {
  const events = await getAdminEvents();

  return <AdminEventsClient events={events} />;
}
