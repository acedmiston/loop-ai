// app/dashboard/DashboardContentServer.tsx
import supabase from '@/lib/supabase'; // your supabase client setup
import { Event, Guest } from '@/types/event'; // assuming types for Event and Guest
import EventCard from '@/components/EventCard';
import Link from 'next/link';

type EventData = {
  id: string;
  input: string;
  tone: string;
  message: string;
  created_at: string;
  title: string;
  date: string;
  time: string;
  guests: { phone: string }[];
};

export default async function DashboardContentServer() {
  const { data: eventData, error } = await supabase
    .from('events')
    .select('*, guests(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[dashboard] Error fetching events:', error);
    return (
      <div className="max-w-3xl p-6 mx-auto bg-white border rounded-lg shadow-sm">
        <div className="p-6 text-red-500">Failed to load events.</div>
        <Link href="/start" className="text-blue-600 hover:underline">
          Try creating a new event →
        </Link>
      </div>
    );
  }

  const events: Event[] = (eventData || []).map((e: EventData) => ({
    id: e.id,
    input: e.input,
    tone: e.tone,
    message: e.message,
    createdAt: e.created_at,
    title: e.title,
    date: e.date || new Date().toISOString(),
    time: e.time,
    guests: (e.guests || []).map((g: { phone: string }) => ({ phone: g.phone })) as Guest[],
  }));

  return (
    <div className="max-w-3xl p-6 mx-auto space-y-6 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b">
        <h1 className="text-2xl font-bold">Your Events</h1>
        <Link
          href="/start"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Create New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="p-8 text-center border-2 border-gray-200 border-dashed rounded-lg">
          <h3 className="mb-2 text-xl font-medium">No events yet</h3>
          <p className="mb-4 text-sm text-gray-500">
            Create your first event to start keeping your friends in the loop.
          </p>
          <Link
            href="/start"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
