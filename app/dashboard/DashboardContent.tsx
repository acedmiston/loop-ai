'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import Link from 'next/link';
import { Event, Guest } from '@/types/event';
import EditEventModal from '@/components/EditEventModal';

export default function DashboardContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, guests(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEvents(
          data.map((e: any) => ({
            id: e.id,
            input: e.input,
            tone: e.tone,
            message: e.message,
            createdAt: e.created_at,
            title: e.title,
            date: e.date || new Date().toISOString(),
            time: e.time,
            guests: (e.guests || []).map((g: any) => ({
              phone: g.phone,
              firstName: g.first_name,
              lastName: g.last_name,
              email: g.email,
            })) as Guest[],
          })) as Event[]
        );
      }
      setLoading(false);
    };

    fetchEvents();
  }, [supabase]);

  if (loading) {
    return <div className="text-center text-gray-500">Loading events...</div>;
  }

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
        <>
          <div className="space-y-4">
            {events.map(event => (
              <EventCard key={event.id} event={event} onEdit={setEditingEvent} />
            ))}
          </div>
          {editingEvent && (
            <EditEventModal
              event={editingEvent}
              onClose={() => setEditingEvent(null)}
              onSave={updatedEvent => {
                setEvents(events => events.map(e => (e.id === updatedEvent.id ? updatedEvent : e)));
                setEditingEvent(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
