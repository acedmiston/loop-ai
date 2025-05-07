'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import Link from 'next/link';
import { Event, Guest } from '@/types/event';
import EditEventModal from '@/components/EditEventModal';
import { motion } from 'framer-motion';

export default function DashboardContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select(
          'id, input, tone, message, created_at, title, date, time, location, location_lat, location_lng, guests(*)'
        )
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEvents(
          data.map(e => ({
            id: e.id,
            input: e.input,
            tone: e.tone,
            message: e.message,
            createdAt: e.created_at,
            title: e.title,
            date: e.date || new Date().toISOString(),
            time: e.time,
            location: e.location,
            location_lat: e.location_lat,
            location_lng: e.location_lng,
            guests: (e.guests || []).map((g: Guest) => ({
              phone: g.phone,
              first_name: g.first_name,
              last_name: g.last_name,
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-3 space-y-1 text-center">
        <h1 className="text-2xl font-bold">Your Upcoming Events</h1>
        <p className="text-sm text-muted-foreground">View and manage your events.</p>
      </div>
      <div className="w-full max-w-4xl p-0 mx-auto space-y-6 md:p-6">
        <div className="flex items-center justify-between pb-4 border-b">
          <div />
          <Link
            href="/create-event"
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
              href="/create-event"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 justify-items-center">
              {events.map(event => (
                <EventCard key={event.id} event={event} onEdit={setEditingEvent} />
              ))}
            </div>
            {editingEvent && (
              <EditEventModal
                event={editingEvent}
                onClose={() => setEditingEvent(null)}
                onSave={updatedEvent => {
                  setEvents(events =>
                    events.map(e => (e.id === updatedEvent.id ? updatedEvent : e))
                  );
                  setEditingEvent(null);
                }}
                onDelete={deletedEventId => {
                  setEvents(events => events.filter(e => e.id !== deletedEventId));
                  setEditingEvent(null);
                }}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
