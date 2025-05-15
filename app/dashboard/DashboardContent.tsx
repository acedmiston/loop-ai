'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import Link from 'next/link';
import { Event, Guest } from '@/types/event';
import EditEventModal from '@/components/EditEventModal';
import { motion } from 'framer-motion';
import SendTextModal from '@/components/SendTextModal';
import { DateTime } from 'luxon';

function isPastEvent(event: Event) {
  // Use Luxon to parse event date as local date
  const eventDate = DateTime.fromISO(event.date, { zone: 'local' }).startOf('day');
  const today = DateTime.local().startOf('day');
  return eventDate < today;
}

export default function DashboardContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [sendModalEvent, setSendModalEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select(
          'id, tone, message, created_at, title, date, start_time, end_time, location, location_lat, location_lng, guests(*)'
        )
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEvents(
          data.map(e => ({
            id: e.id,
            tone: e.tone,
            message: e.message,
            createdAt: e.created_at,
            title: e.title,
            date: e.date || new Date().toISOString(),
            start_time: e.start_time,
            end_time: e.end_time,
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

  // Sort events by soonest date/time first
  const sortEvents = (arr: Event[]) =>
    arr.slice().sort((a, b) => {
      // Use Luxon for robust comparison
      const aDate = DateTime.fromISO(a.date, { zone: 'local' }).startOf('day');
      const bDate = DateTime.fromISO(b.date, { zone: 'local' }).startOf('day');
      // If dates are equal, sort by time if available
      if (aDate.equals(bDate)) {
        if (a.start_time && b.start_time) {
          // Compare times as HH:mm
          const aTime = DateTime.fromFormat(a.start_time, 'HH:mm', { zone: 'local' });
          const bTime = DateTime.fromFormat(b.start_time, 'HH:mm', { zone: 'local' });
          return aTime.toMillis() - bTime.toMillis();
        }
        if (a.start_time) return -1;
        if (b.start_time) return 1;
        return 0;
      }
      return aDate.toMillis() - bDate.toMillis();
    });

  const upcomingEvents = sortEvents(events.filter(event => !isPastEvent(event)));
  const pastEvents = sortEvents(events.filter(event => isPastEvent(event)));

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
        <h1 className="text-2xl font-bold">Your Events</h1>
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
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded-t ${activeTab === 'upcoming' ? 'font-bold border-b-2 border-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Events
          </button>
          <button
            className={`px-4 py-2 rounded-t ${activeTab === 'past' ? 'font-bold border-b-2 border-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('past')}
          >
            Past Events
          </button>
        </div>
        {activeTab === 'upcoming' ? (
          upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 justify-items-center">
              {upcomingEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={setEditingEvent}
                  onResend={() => setSendModalEvent(event)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-gray-200 border-dashed rounded-lg">
              <h3 className="mb-2 text-xl font-medium">No upcoming events</h3>
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
          )
        ) : pastEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 justify-items-center">
            {pastEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={setEditingEvent}
                onResend={() => setSendModalEvent(event)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-gray-200 border-dashed rounded-lg">
            <h3 className="mb-2 text-xl font-medium">No past events</h3>
            <p className="mb-4 text-sm text-gray-500">
              Past events will appear here after their scheduled time.
            </p>
          </div>
        )}
        {editingEvent && (
          <EditEventModal
            event={editingEvent}
            onClose={() => setEditingEvent(null)}
            onSave={updatedEvent => {
              setEvents(events => events.map(e => (e.id === updatedEvent.id ? updatedEvent : e)));
              setEditingEvent(null);
            }}
            onDelete={deletedEventId => {
              setEvents(events => events.filter(e => e.id !== deletedEventId));
              setEditingEvent(null);
            }}
          />
        )}
        {/* SendTextModal for resending notifications */}
        {sendModalEvent && (
          <SendTextModal
            open={true}
            onClose={() => setSendModalEvent(null)}
            guests={sendModalEvent.guests}
            defaultMessage={sendModalEvent.message}
          />
        )}
      </div>
    </motion.div>
  );
}
