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

type FormData = {
  title: string;
  date: string;
  time: string;
  input: string;
  guests: string[];
  tone: string;
  location?: string;
};

const eventSchema = yup.object({
  title: yup.string().required('Title is required'),
  date: yup.string().required('Date is required'),
  time: yup.string().required('Time is required'),
  input: yup.string().required('Event details are required'),
  guests: yup
    .array()
    .of(yup.string().required())
    .min(1, 'At least one guest is required')
    .default([]),
  tone: yup.string().required('Tone is required'),
});

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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(eventSchema),
    defaultValues: {
      title: '',
      date: '',
      time: '',
      input: '',
      tone: 'friendly',
      guests: [],
    },
  });

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
  }, [selectedGuests, setValue]);

  useEffect(() => {
    if (personalize) {
      // If [Name] is not present, add it at the start
      if (message && !message.includes('[Name]')) {
        // Remove 'Hey friends!' if present at the start
        setMessage(prev => {
          let updated = prev.replace(/^Hey friends![,\s]*/i, '');
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

  const handleGenerateMessage = async () => {
    const values = getValues();
    if (!values.title || !values.date || !values.time) {
      toast.error('Please fill in title, date, and time before generating a message.');
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
      const input = `Event Title: ${values.title}\nDate: ${values.date}\nTime: ${values.time}\nDetails: ${msg}`;
      const promptPersonalize = personalize
        ? "\n\nPersonalize the message for each guest by including their first name at the start of the message using the placeholder [Name]. For example: 'Hi [Name], ...'. Do not use any other greeting or signature. Only use the placeholder, do not use a real name."
        : '';
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input + promptPersonalize,
          tone,
          personalize,
          location: location || undefined,
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

  const onSubmit: SubmitHandler<FormData> = async data => {
    setIsSubmitting(true);

    try {
      const payload: {
        title: string;
        date: string;
        time: string;
        input: string;
        guests: string[];
        tone: string;
        message: string;
        location: string;
        location_lat: number | undefined;
        location_lng: number | undefined;
        personalize: boolean;
      } = {
        ...data,
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
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create event');

      reset();
      setSelectedGuests([]);
      setMessage('');
      localStorage.removeItem('event-form');

      toast('Event created successfully!', {
        description: 'Your event has been created and guests will be notified.',
        action: {
          label: 'Go to Dashboard',
          onClick: () => router.push('/dashboard'),
        },
      });

      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-start justify-center w-full min-h-screen pt-4 pb-16 bg-background">
      <div className="w-full max-w-lg p-6 space-y-6 bg-white border shadow-lg rounded-2xl">
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
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor="date" className="block font-medium text-md">
                  Date
                </Label>
                <Input type="date" id="date" {...register('date', { required: true })} />
                {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>}
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="time" className="block font-medium text-md">
                  Time
                </Label>
                <Input
                  type="text"
                  id="time"
                  {...register('time', { required: 'Time is required.' })}
                  placeholder="e.g. 7:30 PM"
                />
                {errors.time && <p className="mt-1 text-sm text-red-500">{errors.time.message}</p>}
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
              placeholder="Event Location"
            />
          </div>
          {/* Guests Section */}
          <div className="space-y-1">
            <Label htmlFor="guests" className="block font-medium text-md">
              Friends to notify
            </Label>
            <div className="p-2 border rounded-md border-input">
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
            <select
              id="tone"
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
                generating || !getValues('title') || !getValues('date') || !getValues('time')
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
                  const previewName = firstSelected?.first_name || firstSelected?.name || 'friend';
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
            <Button type="submit" disabled={isSubmitting || !message.trim()} variant="default">
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
