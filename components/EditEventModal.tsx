import { useEffect, useState } from 'react';
import { Event } from '@/types/event';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { createSupabaseClient } from '@/lib/supabase';
import { toast } from 'sonner';
import GuestSelector from './GuestSelector';
import { Guest } from '@/types/event';

export default function EditEventModal({
  event,
  onClose,
  onSave,
}: {
  event: Event;
  onClose: () => void;
  onSave: (event: Event) => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [message, setMessage] = useState(event.message);
  const [saving, setSaving] = useState(false);
  const supabase = createSupabaseClient();
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>(event.guests.map(g => g.phone));

  // Fetch all contacts on mount
  useEffect(() => {
    const fetchGuests = async () => {
      const res = await fetch('/api/guests');
      const data = await res.json();
      setAllGuests(
        (data.guests || []).map((g: any) => ({
          ...g,
          firstName: g.first_name,
          lastName: g.last_name,
        }))
      );
    };
    fetchGuests();
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !date || !time.trim() || !message.trim() || selectedGuests.length === 0) {
      toast.error('Please fill in all required fields and select at least one guest.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('events')
      .update({
        title,
        date,
        time,
        message,
      })
      .eq('id', event.id);

    if (error) {
      toast.error('Failed to update event');
      setSaving(false);
      return;
    }

    // Update guests
    await supabase.from('event_guests').delete().eq('event_id', event.id);
    // Add new selected guests
    const { data: guestRows } = await supabase
      .from('guests')
      .select('id')
      .in('phone', selectedGuests);

    if (guestRows && guestRows.length > 0) {
      const eventGuestInserts = guestRows.map((g: any) => ({
        event_id: event.id,
        guest_id: g.id,
      }));
      await supabase.from('event_guests').insert(eventGuestInserts);
    }

    // Update local event object
    const updatedEvent = {
      ...event,
      title,
      date,
      time,
      message,
      guests: allGuests.filter(g => selectedGuests.includes(g.phone)),
    };

    onSave(updatedEvent);
    toast.success('Event updated!');
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg p-8 space-y-6 bg-white shadow-lg rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close X button */}
        <button
          className="absolute text-2xl font-bold text-gray-400 top-4 right-6 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          x
        </button>
        <h3 className="text-2xl font-bold">Edit Event</h3>
        <div className="space-y-2">
          <label htmlFor="edit-title" className="block font-medium text-md">
            Title
          </label>
          <Input
            id="edit-title"
            className="h-12 py-3 text-lg"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Event Title"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="edit-date" className="block font-medium text-md">
            Date
          </label>
          <Input
            id="edit-date"
            type="date"
            className="h-12 py-3 text-lg"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="edit-time" className="block font-medium text-md">
            Time
          </label>
          <Input
            id="edit-time"
            className="h-12 py-3 text-lg"
            value={time}
            onChange={e => setTime(e.target.value)}
            placeholder="Event Time"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="edit-message" className="block font-medium text-md">
            Message
          </label>
          <Textarea
            id="edit-message"
            className="py-3 text-lg"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            placeholder="Event Message"
          />
        </div>
        <div className="space-y-2">
          <label className="block font-medium text-md">Guests</label>
          <GuestSelector
            guests={allGuests}
            selected={selectedGuests}
            setSelected={setSelectedGuests}
            fetchGuests={async () => {}}
          />
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={
              saving ||
              !title.trim() ||
              !date ||
              !time.trim() ||
              !message.trim() ||
              selectedGuests.length === 0
            }
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
