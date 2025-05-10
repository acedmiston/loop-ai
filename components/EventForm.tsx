'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import GuestSelector from './GuestSelector';
import LocationAutocomplete from './LocationAutocomplete';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Guest } from '@/types/event';
import EventCard from './EventCard';
import EventDateTimeModal from './EventDateTimeModal';
import 'react-datepicker/dist/react-datepicker.css';
import { InferType } from 'yup';
import { DateTime } from 'luxon';
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon } from 'lucide-react';

const eventSchema = yup
  .object({
    title: yup.string().required('Title is required'),
    date: yup.string().required('Date is required'),
    start_time: yup.string().required('Start time is required'),
    input: yup.string().required('Event details are required'),
    guests: yup
      .array()
      .of(yup.string().required())
      .min(1, 'At least one guest is required')
      .default([]),
    tone: yup.string().required('Tone is required'),
  })
  .required();

export type EventFormData = InferType<typeof eventSchema> & {
  location?: string;
  end_time?: string;
};

// Helper to format time in AM/PM using Luxon
function formatTimeAMPM(time: string) {
  if (!time) return '';
  try {
    return DateTime.fromFormat(time, 'HH:mm').toFormat('h:mm a');
  } catch {
    return time;
  }
}

// Helper to format date as 'Thursday, May 5th'
function formatDateWithOrdinalLuxon(date: Date | null) {
  if (!date) return '';
  const day = date.getDate();
  const ordinal = (n: number) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };
  return DateTime.fromJSDate(date).toFormat("cccc, LLLL d'") + ordinal(day);
}

// Helper to personalize message preview (reused from SendTextModal)
function getPersonalizedPreview(message: string, guests: Guest[], selectedPhones: string[]) {
  const previewGuest = guests.find(g => selectedPhones.includes(g.phone)) || guests[0] || {};
  const previewName = previewGuest.first_name || previewGuest.name || 'friend';
  return message.replace(/\[Name\]/g, previewName);
}

export default function EventForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tone, setTone] = useState('friendly');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [locationLat, setLocationLat] = useState<number | undefined>(undefined);
  const [locationLng, setLocationLng] = useState<number | undefined>(undefined);
  const [personalize, setPersonalize] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'send' | 'review'>('details');
  const [messageSent, setMessageSent] = useState(false);
  const [hasEndTime, setHasEndTime] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: yupResolver(eventSchema),
    defaultValues: {
      title: '',
      date: '',
      start_time: '',
      end_time: '',
      input: '',
      tone: 'friendly',
      guests: [],
    },
  });

  // Helper to format date with ordinal
  function formatDateWithOrdinal(date: Date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const day = date.getDate();
    const ordinal = (n: number) => {
      if (n > 3 && n < 21) return 'th';
      switch (n % 10) {
        case 1:
          return 'st';
        case 2:
          return 'nd';
        case 3:
          return 'rd';
        default:
          return 'th';
      }
    };
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${day}${ordinal(day)}`;
  }

  // Fetch guests on mount
  const fetchGuests = async () => {
    const res = await fetch('/api/guests');
    const data = await res.json();
    setGuests(
      (data.guests || []).map((g: Guest) => ({
        ...g,
        firstName: g.first_name,
        lastName: g.last_name,
      }))
    );
  };

  // Fetch guests on mount
  useEffect(() => {
    fetchGuests();
  }, []);

  // Keep guests in sync with form
  useEffect(() => {
    setValue('guests', selectedGuests);
    setHasEndTime(!!getValues('end_time'));
  }, [selectedGuests, setValue]);

  useEffect(() => {
    if (personalize) {
      // If [Name] is not present, add it at the start
      if (message && !message.includes('[Name]')) {
        // Remove 'Hey friends!' if present at the start
        setMessage(prev => {
          const updated = prev.replace(/^Hey friends![,\s]*/i, '');
          return `Hi [Name], ${updated}`.replace(/^\s+/, '');
        });
      }
    } else {
      // If unchecking, replace any greeting with 'Hey friends!'
      if (message && /Hi \[Name\][,!]?\s*|Hey \[Name\][,!]?\s*/i.test(message)) {
        setMessage(prev => prev.replace(/^(Hi|Hey) \[Name\][,!]?\s*/i, 'Hey friends! '));
      } else if (message && message.trim() === '') {
        setMessage('Hey friends!');
      }
    }
    // eslint-disable-next-line
  }, [personalize]);

  useEffect(() => {
    // If editing, set initial values from form
    const s = getValues('start_time');
    const e = getValues('end_time');
    if (s) setStartDate(new Date(`${getValues('date')}T${s}`));
    if (e) setEndDate(new Date(`${getValues('date')}T${e}`));
  }, []);

  const handleGenerateMessage = async () => {
    const values = getValues();
    if (!values.title || !values.date || !values.start_time) {
      toast.error('Please fill in title, date, and start time before generating a message.');
      return;
    }
    setGenerating(true);
    try {
      // Always construct the message with the correct greeting based on personalize
      let msg = message.trim();
      if (personalize) {
        // Remove any existing greeting and ensure [Name] is at the start
        msg = msg.replace(/^Hey friends![,\s]*/i, '');
        if (!msg.startsWith('Hi [Name],')) {
          msg = `Hi [Name], ${msg}`.replace(/^\s+/, '');
        }
      } else {
        // Remove any personalized greeting and use Hey friends!
        msg = msg.replace(/^Hi \[Name\],?\s*/i, 'Hey friends! ');
        if (!msg.startsWith('Hey friends!')) {
          msg = `Hey friends! ${msg}`;
        }
      }
      let input = `Event Title: ${values.title}\nDate: ${values.date}\nStart Time: ${formatTimeAMPM(values.start_time)}`;
      if (hasEndTime && values.end_time) {
        input += `\nEnd Time: ${formatTimeAMPM(values.end_time)}`;
      }
      input += `\nDetails: ${msg}`;
      const promptPersonalize = personalize
        ? "\n\nPersonalize the message for each guest by including their first name at the start of the message using the placeholder [Name]. For example: 'Hi [Name], ...'. Do not use any other greeting or signature. Only use the placeholder, do not use a real name."
        : '';
      // --- Luxon displayTime and displayDate logic ---
      let displayTime = '';
      let displayDate = '';
      if (startDate) {
        displayTime = DateTime.fromJSDate(startDate).toFormat('h:mm a');
        if (hasEndTime && endDate) {
          displayTime += ` – ${DateTime.fromJSDate(endDate).toFormat('h:mm a')}`;
        }
        displayDate = formatDateWithOrdinalLuxon(startDate);
      }
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input + promptPersonalize,
          tone,
          personalize,
          location: location || undefined,
          displayTime,
          displayDate,
        }),
      });
      const data = await response.json();
      if (data.message) {
        setMessage(data.message);
        toast.success('Message generated!');
      } else {
        toast.error('Failed to generate message.');
      }
    } catch {
      toast.error('Error generating message.');
    }
    setGenerating(false);
  };

  const onSubmit: SubmitHandler<EventFormData> = async data => {
    setIsSubmitting(true);
    const payload = {
      ...data,
      end_time: data.end_time ? data.end_time : undefined, // treat '' as undefined
    };

    try {
      const finalPayload = {
        ...payload,
        guests: selectedGuests,
        message: message.trim(),
        location,
        location_lat: locationLat,
        location_lng: locationLng,
        personalize, // send this option to backend
      };

      const res = await fetch('/api/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalPayload),
      });

      if (!res.ok) throw new Error('Failed to create event');

      reset();
      setSelectedGuests([]);
      setMessage('');
      localStorage.removeItem('event-form');

      toast('Event created successfully!', {
        description: 'Your event has been created and guests will be notified.',
      });
      router.push('/dashboard');
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get selected guest objects
  const selectedGuestObjects = guests.filter(g => selectedGuests.includes(g.phone));

  return (
    <div className="flex items-start justify-center w-full min-h-screen pt-4 pb-16 bg-background">
      <div className="w-full max-w-lg p-6 space-y-6 bg-white border shadow-lg rounded-2xl">
        {/* Tabs */}
        <div className="flex mb-4 border-b">
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
            onClick={() => setActiveTab('details')}
            type="button"
          >
            Details
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'send' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
            onClick={() => setActiveTab('send')}
            type="button"
            disabled={selectedGuests.length === 0 || !message.trim()}
          >
            Send Message
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'review' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
            onClick={() => setActiveTab('review')}
            type="button"
            disabled={!messageSent && activeTab !== 'review'}
          >
            Review
          </button>
        </div>
        {/* Tab Content */}
        {activeTab === 'details' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Event Details */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title" className="block font-medium text-md">
                  Title
                </Label>
                <Input
                  id="title"
                  {...register('title', { required: true })}
                  placeholder="e.g. Birthday Dinner"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="date-time" className="block font-medium text-md">
                    Event Date & Time
                  </Label>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none h-9 min-w-0 text-base md:text-sm border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive ${!startDate ? 'text-muted-foreground' : 'text-foreground'}`}
                    onClick={() => setShowDateModal(true)}
                  >
                    {startDate ? (
                      <>
                        <div className="font-medium">{formatDateWithOrdinal(startDate)}</div>
                        <div>
                          {startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          {hasEndTime && endDate ? (
                            <>
                              {' '}
                              <span className="mx-1">-</span>{' '}
                              {endDate.toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      'Select Date & Time'
                    )}
                  </button>
                  {showDateModal && (
                    <EventDateTimeModal
                      initialStartDate={startDate}
                      initialEndDate={endDate}
                      initialHasEnd={hasEndTime}
                      onClose={() => setShowDateModal(false)}
                      onSave={(start, end, hasEnd) => {
                        setShowDateModal(false);
                        setStartDate(start);
                        setEndDate(end);
                        setHasEndTime(hasEnd);
                        if (start) {
                          setValue('date', start.toISOString().slice(0, 10));
                          setValue('start_time', start.toISOString().slice(11, 16));
                        }
                        if (hasEnd && end) {
                          setValue('end_time', end.toISOString().slice(11, 16));
                        } else {
                          setValue('end_time', '');
                        }
                      }}
                    />
                  )}
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
                  )}
                  {errors.start_time && (
                    <p className="mt-1 text-sm text-red-500">{errors.start_time.message}</p>
                  )}
                </div>
              </div>
            </div>
            {/* Location Section */}
            <div className="space-y-1">
              <Label htmlFor="location" className="block font-medium text-md">
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
                placeholder="Where will this take place?"
              />
            </div>
            {/* Guests Section */}
            <div className="space-y-1">
              <Label htmlFor="guests" className="block font-medium text-md">
                Friends to notify
              </Label>
              <div>
                <GuestSelector
                  guests={guests}
                  selected={selectedGuests}
                  setSelected={setSelectedGuests}
                  fetchGuests={fetchGuests}
                />
                <input type="hidden" {...register('guests')} value={selectedGuests} />
              </div>
              {errors.guests && (
                <p className="mt-1 text-sm text-red-500">{errors.guests.message as string}</p>
              )}
            </div>
            {/* Event Details Textarea */}
            <div className="space-y-1">
              <Label htmlFor="input" className="block font-medium text-md">
                Event details
              </Label>
              <Textarea
                id="input"
                {...register('input')}
                rows={3}
                placeholder="This will be used as the AI prompt or sent as the message."
              />
              {errors.input && <p className="mt-1 text-sm text-red-500">{errors.input.message}</p>}
            </div>
            {/* Tone and AI Message Generation */}
            <div className="space-y-1">
              <Label htmlFor="tone" className="block font-medium text-md">
                Tone
              </Label>
              <Select.Root value={tone} onValueChange={setTone}>
                <Select.Trigger
                  id="tone"
                  className="w-full flex items-center justify-between px-2 pr-4 h-9 text-sm border rounded-md bg-transparent border-input text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                  aria-label="Tone"
                >
                  <Select.Value placeholder="Select tone" />
                  <Select.Icon className="text-muted-foreground">
                    <ChevronDownIcon size={18} />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 bg-white border rounded-md shadow-lg">
                    <Select.Viewport className="p-1">
                      <Select.Item
                        value="friendly"
                        className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-blue-50"
                      >
                        <Select.ItemText>Friendly</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        value="formal"
                        className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-blue-50"
                      >
                        <Select.ItemText>Formal</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        value="casual"
                        className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-blue-50"
                      >
                        <Select.ItemText>Casual</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        value="apologetic"
                        className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-blue-50"
                      >
                        <Select.ItemText>Apologetic</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
            {/* Personalize checkbox and AI generation button */}
            <div className="flex items-center justify-between gap-2 mt-2">
              <label className="flex items-center gap-2 m-0 text-sm">
                <input
                  type="checkbox"
                  checked={personalize}
                  onChange={e => setPersonalize(e.target.checked)}
                  className="accent-blue-600"
                />
                Personalize with each friend&apos;s name
              </label>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateMessage}
                disabled={
                  generating ||
                  !getValues('title') ||
                  !getValues('date') ||
                  !getValues('start_time') ||
                  (!getValues('end_time') && hasEndTime)
                }
                className="ml-2"
              >
                {generating ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>
            <div className="space-y-1">
              <Label htmlFor="message" className="block font-medium text-md">
                Message (Editable)
              </Label>
              <p className="text-sm text-muted-foreground">
                (Don&apos;t remove the [Name] placeholder, if you want them personalized!)
              </p>
              <Textarea
                id="message"
                className="py-3 text-lg"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="Event Message"
              />
              {message.trim() && (
                <div className="p-4 mt-4 text-sm text-blue-900 border border-blue-200 rounded-md shadow-sm bg-blue-50">
                  <span className="font-semibold text-blue-700">Preview:</span>{' '}
                  {(() => {
                    const firstSelected = guests.find(g => selectedGuests[0] === g.phone);
                    const previewName =
                      firstSelected?.first_name || firstSelected?.name || 'friend';
                    let preview = message;
                    if (personalize) {
                      // Replace [Name] with previewName
                      preview = preview.replace(/\[Name\]/g, previewName);
                    }
                    return preview;
                  })()}
                </div>
              )}
              {personalize && (
                <div className="mt-2 mb-2 text-sm text-blue-500">
                  Note: Each friend will see their own name if personalized is checked!
                </div>
              )}
            </div>
            <div className="flex justify-end gap-4 pt-2">
              <Button
                type="button"
                onClick={() => setActiveTab('send')}
                disabled={isSubmitting || !message.trim() || selectedGuests.length === 0}
                variant="default"
              >
                Next
              </Button>
            </div>
          </form>
        )}
        {activeTab === 'send' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-xl font-bold">Send Text Message</h2>
              <div className="mb-3">
                <label className="block mb-1 font-medium">Recipients</label>
                <div className="flex flex-wrap gap-2">
                  {guests
                    .filter(g => selectedGuests.includes(g.phone))
                    .map(g => (
                      <label
                        key={g.phone}
                        className={`flex items-center gap-1 text-sm ${g.opted_out ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={
                          g.opted_out ? 'This guest has opted out and cannot receive messages.' : ''
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selectedGuests.includes(g.phone)}
                          onChange={e => {
                            setSelectedGuests(phones =>
                              e.target.checked
                                ? [...phones, g.phone]
                                : phones.filter(p => p !== g.phone)
                            );
                          }}
                          disabled={g.opted_out}
                        />
                        {g.name || g.first_name || g.phone}
                        {g.opted_out && (
                          <span className="ml-1 px-1 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                            Opted out
                          </span>
                        )}
                      </label>
                    ))}
                </div>
                {/* Show a warning if any selected guests are opted out */}
                {guests.some(g => selectedGuests.includes(g.phone) && g.opted_out) && (
                  <div className="mt-2 text-xs text-red-600">
                    Some selected guests have opted out and will not receive messages.
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-medium">Message</label>
                <div className="mb-2 text-xs text-gray-500">
                  (For your last minute edits before sending, just don't remove{' '}
                  <span className="font-bold">[Name]</span> to keep it personalized!)
                </div>
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>
              <div className="mb-3">
                <div className="px-4 py-2 text-blue-800 border border-blue-200 rounded-lg bg-blue-50">
                  <span className="text-sm font-bold">Preview:</span>{' '}
                  <div className="text-sm text-gray-700">
                    {getPersonalizedPreview(message, guests, selectedGuests)}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTab('details')}>
                  Back
                </Button>
                <Button variant="secondary" onClick={() => setActiveTab('review')}>
                  Skip for now
                </Button>
                <Button
                  onClick={async () => {
                    for (const phone of selectedGuests) {
                      await fetch('/api/send-sms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ to: phone, body: message }),
                      });
                    }
                    toast.success('Message sent!');
                    setMessageSent(true);
                    setActiveTab('review');
                  }}
                  disabled={selectedGuests.length === 0 || !message.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'review' && (
          <div className="space-y-6">
            <h2 className="mb-4 text-xl font-bold">Review &amp; Save</h2>
            <EventCard
              event={{
                id: 'preview',
                input: getValues('input'),
                title: getValues('title'),
                date: getValues('date'),
                start_time: getValues('start_time'),
                end_time: hasEndTime && getValues('end_time') ? getValues('end_time') : undefined,
                tone,
                message,
                createdAt: new Date().toISOString(),
                guests: selectedGuestObjects,
                location,
                location_lat: locationLat,
                location_lng: locationLng,
              }}
              disableActions={true}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActiveTab('send')}>
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                variant="default"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
