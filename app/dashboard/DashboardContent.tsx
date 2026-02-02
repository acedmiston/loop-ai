'use client';

import { useEffect, useRef, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import Link from 'next/link';
import { Event, Guest } from '@/types/event';
import EditEventModal from '@/components/EditEventModal';
import PageShell from '@/components/PageShell';
import PageHeader from '@/components/PageHeader';
import SendTextModal from '@/components/SendTextModal';
import { DateTime } from 'luxon';

type YearMonthSection = { year: number; month: number; monthLabel: string; events: Event[] };
type TimelineYear = { year: number; months: { month: number; monthLabel: string }[] };

function isPastEvent(event: Event) {
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
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select(
          'id, tone, message, created_at, title, date, start_time, end_time, end_date, location, location_lat, location_lng, guests(*)'
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
            end_date: e.end_date,
            location: e.location,
            location_lat: e.location_lat,
            location_lng: e.location_lng,
            guests: (e.guests || []).map((g: Guest) => ({
              phone: g.phone,
              first_name: g.first_name,
              last_name: g.last_name,
              id: g.id,
              email: g.email,
            })) as Guest[],
          })) as Event[]
        );
      }
      setLoading(false);
    };

    fetchEvents();
  }, [supabase]);

  // Sort upcoming events by soonest date/time first
  const sortUpcomingEvents = (arr: Event[]) =>
    arr.slice().sort((a, b) => {
      const aDate = DateTime.fromISO(a.date, { zone: 'local' }).startOf('day');
      const bDate = DateTime.fromISO(b.date, { zone: 'local' }).startOf('day');
      if (aDate.equals(bDate)) {
        if (a.start_time && b.start_time) {
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

  // Sort past events by newest to oldest (most recent first)
  const sortPastEvents = (arr: Event[]) =>
    arr.slice().sort((a, b) => {
      const aDate = DateTime.fromISO(a.date, { zone: 'local' }).startOf('day');
      const bDate = DateTime.fromISO(b.date, { zone: 'local' }).startOf('day');
      if (aDate.equals(bDate)) {
        if (a.start_time && b.start_time) {
          const aTime = DateTime.fromFormat(a.start_time, 'HH:mm', { zone: 'local' });
          const bTime = DateTime.fromFormat(b.start_time, 'HH:mm', { zone: 'local' });
          return bTime.toMillis() - aTime.toMillis(); // descending for past
        }
        if (a.start_time) return 1;
        if (b.start_time) return -1;
        return 0;
      }
      return bDate.toMillis() - aDate.toMillis(); // newest first
    });

  const upcomingEvents = sortUpcomingEvents(events.filter(event => !isPastEvent(event)));
  const pastEvents = sortPastEvents(events.filter(event => isPastEvent(event)));

  /** Ordered list of year+month sections (in display order) for timeline and content */
  function eventsByYearMonth(sortedEvents: Event[]): YearMonthSection[] {
    const seen = new Set<string>();
    const sections: YearMonthSection[] = [];
    for (const e of sortedEvents) {
      const dt = DateTime.fromISO(e.date, { zone: 'local' });
      const key = `${dt.year}-${dt.month}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sections.push({
        year: dt.year,
        month: dt.month,
        monthLabel: dt.toFormat('MMMM'),
        events: sortedEvents.filter(
          ev =>
            DateTime.fromISO(ev.date, { zone: 'local' }).year === dt.year &&
            DateTime.fromISO(ev.date, { zone: 'local' }).month === dt.month
        ),
      });
    }
    return sections;
  }

  /** Build timeline nav: years with their months in display order */
  function buildTimeline(sections: YearMonthSection[]): TimelineYear[] {
    const byYear = new Map<number, { month: number; monthLabel: string }[]>();
    for (const s of sections) {
      if (!byYear.has(s.year)) byYear.set(s.year, []);
      byYear.get(s.year)!.push({ month: s.month, monthLabel: s.monthLabel });
    }
    const orderedYears = [...new Set(sections.map(s => s.year))];
    return orderedYears.map(year => ({ year, months: byYear.get(year)! }));
  }

  function scrollToSection(year: number, month: number) {
    const key = `${year}-${month}`;
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderEventList(sortedEvents: Event[]) {
    const sections = eventsByYearMonth(sortedEvents);
    const timeline = buildTimeline(sections);
    return { sections, timeline };
  }

  if (loading) {
    return <div className="text-center text-gray-500">Loading events...</div>;
  }

  const currentEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;
  const { sections, timeline } =
    currentEvents.length > 0
      ? renderEventList(currentEvents)
      : { sections: [] as YearMonthSection[], timeline: [] as TimelineYear[] };

  const showTimeline = currentEvents.length > 0 && timeline.length > 0;

  return (
    <PageShell className="max-w-6xl">
      <div
        className={`grid gap-x-4 gap-y-2 sm:gap-x-8 grid-cols-1 grid-rows-[auto_auto_1fr] px-2 sm:px-0 ${showTimeline ? 'sm:grid-cols-[7rem_1fr]' : ''}`}
      >
        {/* Row 1: header spans full width; on sm+ with timeline spans 2 cols */}
        <div className={`${showTimeline ? 'col-span-1 sm:col-span-2' : 'col-span-1'} pb-2`}>
          <PageHeader
            title="Your Events"
            subtitle="View and manage your events."
            action={
              <Link
                href="/create-event"
                className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create New Event
              </Link>
            }
          />
        </div>
        {/* Row 2: tabs at top of cell; on sm+ with timeline, start at col 2 */}
        <div
          className={`flex flex-wrap items-start gap-2 sm:gap-4 pt-0 pb-6 ${showTimeline ? 'sm:col-start-2' : ''}`}
        >
          <button
            className={`px-4 py-2 rounded-t text-lg ${activeTab === 'upcoming' ? 'font-bold border-b-2 border-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Events
          </button>
          <button
            className={`px-4 py-2 rounded-t text-lg ${activeTab === 'past' ? 'font-bold border-b-2 border-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('past')}
          >
            Past Events
          </button>
        </div>
        {/* Row 3: timeline (col 1) and event list (col 2) share the same row — aligns by layout, no fixed padding */}
        {showTimeline && (
          <aside
            className="sticky self-start hidden min-h-0 top-6 sm:block"
            aria-label="Jump to year or month"
          >
            <nav className="pr-4 space-y-2 border-r border-gray-200">
              {timeline.map(({ year, months }) => (
                <div key={year}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(year, months[0].month)}
                    className="block w-full text-sm font-semibold text-left text-gray-700 hover:text-blue-600 focus:outline-none focus:underline"
                  >
                    {year}
                  </button>
                  <ul className="mt-1 ml-2 space-y-0.5 border-l border-gray-200 pl-2">
                    {months.map(({ month, monthLabel }) => (
                      <li key={month}>
                        <button
                          type="button"
                          onClick={() => scrollToSection(year, month)}
                          className="block w-full text-xs text-left text-gray-500 hover:text-blue-600 focus:outline-none focus:underline"
                        >
                          {monthLabel}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>
        )}
        <main className={`min-w-0 space-y-6 col-span-1 ${showTimeline ? 'sm:col-start-2' : ''}`}>
          {currentEvents.length > 0 ? (
            <div className="space-y-8">
              {sections.map(({ year, month, monthLabel, events: eventsInSection }) => (
                <section
                  key={`${year}-${month}`}
                  ref={el => {
                    sectionRefs.current[`${year}-${month}`] = el;
                  }}
                  className="scroll-mt-32"
                >
                  <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    {monthLabel} {year}
                  </h3>
                  <div
                    className="grid items-start w-full min-w-0 grid-cols-1 gap-6 md:grid-cols-2 justify-items-center"
                    style={{
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                    }}
                  >
                    {eventsInSection.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={setEditingEvent}
                        onResend={() => setSendModalEvent(event)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : activeTab === 'upcoming' ? (
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
          ) : (
            <div className="p-8 text-center border-2 border-gray-200 border-dashed rounded-lg">
              <h3 className="mb-2 text-xl font-medium">No past events</h3>
              <p className="mb-4 text-sm text-gray-500">
                Past events will appear here after their scheduled time.
              </p>
            </div>
          )}
        </main>
      </div>
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
          eventId={sendModalEvent.id}
        />
      )}
    </PageShell>
  );
}
