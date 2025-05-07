import { useEffect, useState } from 'react';
import { Event } from '@/types/event';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { createSupabaseClient } from '@/lib/supabase';
import { toast } from 'sonner';
import GuestSelector from './GuestSelector';
import { Guest } from '@/types/event';
import { Label } from './ui/label';
import LocationAutocomplete from './LocationAutocomplete';

export default function EditEventModal({
  event,
  onClose,
  onSave,
  onDelete,
}: {
  event: Event;
  onClose: () => void;
  onSave: (event: Event) => void;
  onDelete?: (eventId: string) => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [message, setMessage] = useState(event.message);
  const [saving, setSaving] = useState(false);
  const [tone, setTone] = useState(event.tone || 'friendly');
  const [generating, setGenerating] = useState(false);
  const [personalize, setPersonalize] = useState(false);
  const supabase = createSupabaseClient();
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>(event.guests.map(g => g.phone));
  const [location, setLocation] = useState(event.location || '');
  const [locationLat, setLocationLat] = useState<number | undefined>(event.location_lat);
  const [locationLng, setLocationLng] = useState<number | undefined>(event.location_lng);

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
        location,
        location_lat: locationLat,
        location_lng: locationLng,
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
      location,
      location_lat: locationLat,
      location_lng: locationLng,
      guests: allGuests.filter(g => selectedGuests.includes(g.phone)),
    };

    onSave(updatedEvent);
    toast.success('Event updated!');
    setSaving(false);
  };

  const handleDelete = async () => {
    if (
      !window.confirm('Are you sure you want to delete this event? This action cannot be undone.')
    )
      return;
    setSaving(true);
    // Remove event guests first
    await supabase.from('event_guests').delete().eq('event_id', event.id);
    // Remove the event itself
    const { error } = await supabase.from('events').delete().eq('id', event.id);
    if (error) {
      toast.error('Failed to delete event');
      setSaving(false);
      return;
    }
    toast.success('Event deleted!');
    setSaving(false);
    if (onDelete) {
      onDelete(event.id);
    } else {
      onClose();
    }
  };

  const handleGenerateMessage = async () => {
    if (!title.trim() || !date || !time.trim()) {
      toast.error('Please fill in title, date, and time before generating a message.');
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: `Event Title: ${title}\nDate: ${date}\nTime: ${time}\nDetails: ${message}`,
          tone,
          personalize,
        }),
      });
      const data = await response.json();
      if (data.message) {
        setMessage(data.message);
        toast.success('Message generated!');
      } else {
        toast.error('Failed to generate message.');
      }
    } catch (err) {
      toast.error('Error generating message.');
    }
    setGenerating(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg p-4 space-y-3 bg-white shadow-lg rounded-2xl"
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
        <div className="space-y-1">
          <Label htmlFor="edit-title" className="block font-medium text-md">
            Title
          </Label>
          <Input
            id="edit-title"
            className="h-12 py-3 text-lg"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Event Title"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="edit-date" className="block font-medium text-md">
              Date
            </Label>
            <Input
              id="edit-date"
              type="date"
              className="h-12 py-3 text-lg"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="edit-time" className="block font-medium text-md">
              Time
            </Label>
            <Input
              id="edit-time"
              className="h-12 py-3 text-lg"
              value={time}
              onChange={e => setTime(e.target.value)}
              placeholder="Event Time"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-location" className="block font-medium text-md">
            Location
          </Label>
          <LocationAutocomplete
            value={location}
            onChange={setLocation}
            onSelect={place => {
              setLocation(place.place_name);
              if (place.center && place.center.length === 2) {
                setLocationLng(place.center[0]);
                setLocationLat(place.center[1]);
              }
            }}
            placeholder="Event Location"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-guests" className="block font-medium text-md">
            Friends to invite
          </Label>
          <GuestSelector
            guests={allGuests}
            selected={selectedGuests}
            setSelected={setSelectedGuests}
            fetchGuests={async () => {}}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-message" className="block font-medium text-md">
            Message to Friends
          </Label>
          <div className="p-3 space-y-2 border rounded-lg d bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="edit-tone" className="block mb-1 text-sm font-small">
                  Message Tone
                </Label>
                <select
                  id="edit-tone"
                  className="w-full h-12 px-2 py-3 border rounded-md text-md"
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                >
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="apologetic">Apologetic</option>
                </select>
              </div>
            </div>
            {/* Personalize checkbox before AI generation */}
            <div className="flex items-center justify-between pb-1 gap-x-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={personalize}
                  onChange={e => setPersonalize(e.target.checked)}
                  className="accent-blue-600"
                />
                Personalize with each friend's name
              </label>
              <Button
                size="sm"
                onClick={handleGenerateMessage}
                disabled={generating || !title.trim() || !date || !time.trim()}
              >
                {generating ? 'Generating...' : 'Regenerate'}
              </Button>
            </div>
            <Label htmlFor="message-preview" className="block mb-1 text-sm font-small">
              Message Preview
            </Label>
            <Textarea
              id="edit-message"
              className="py-3 mt-1 text-lg"
              value={
                personalize && message.includes('{{firstName}}') && selectedGuests.length > 0
                  ? (() => {
                      const firstGuest = allGuests.find(g => g.phone === selectedGuests[0]);
                      const previewName = firstGuest?.firstName || 'friend';
                      return message.replace(/\{\{firstName\}\}/g, previewName);
                    })()
                  : message
              }
              onChange={e => setMessage(e.target.value)}
              rows={7}
              placeholder="Event Message"
            />
            {personalize && (
              <div className="mt-2 text-xs text-yellow-600">
                {(() => {
                  const firstGuest = allGuests.find(g => selectedGuests[0] === g.phone);
                  const firstName = firstGuest?.firstName || 'friend';
                  return `Note: Each guest will receive a personalized message with their own name, not just ${firstName}`;
                })()}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 pt-4">
          <div>
            <Button variant="destructive" size="lg" onClick={handleDelete} disabled={saving}>
              Delete
            </Button>
          </div>
          <div className="flex gap-4">
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
    </div>
  );
}
