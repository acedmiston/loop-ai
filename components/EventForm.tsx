'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import MessagePreview from './MessagePreview';
import GuestSelector from './GuestSelector';
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
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [messageMode, setMessageMode] = useState<'single' | 'group'>('group');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [personalizedMessages, setPersonalizedMessages] = useState<
    { name: string; message: string }[]
  >([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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
      (data.guests || []).map((g: any) => ({
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

  const handleGenerateMessage = async () => {
    const values = getValues();
    if (!values.title || !values.date || !values.time) {
      toast.error('Please fill in title, date, and time before generating a message.');
      return;
    }
    const structuredInput = `Event Title: ${values.title}\nDate: ${values.date}\nTime: ${values.time}\nDetails: ${values.input}`;

    if (messageMode === 'single') {
      const guestNames = selectedGuests
        .map(phone => {
          const guest = guests.find(g => g.phone === phone);
          return guest?.firstName || guest?.phone;
        })
        .filter(Boolean);

      const personalized: { name: string; message: string }[] = [];
      for (const name of guestNames) {
        const response = await fetch('/api/generate-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: `${structuredInput}\nGuest Name: ${name}`,
            tone: values.tone,
          }),
        });
        const { message } = await response.json();
        personalized.push({ name: name || 'Guest', message });
      }
      setPersonalizedMessages(personalized);
      setGeneratedMessage(''); // Clear group message
    } else {
      const messageResponse = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: structuredInput,
          tone: values.tone,
        }),
      });
      const { message } = await messageResponse.json();
      setGeneratedMessage(message);
      setPersonalizedMessages([]);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async data => {
    setIsSubmitting(true);

    try {
      const payload: any = {
        ...data,
        guests: selectedGuests,
      };

      if (messageMode === 'single') {
        payload.personalizedMessages = personalizedMessages;
      } else if (generatedMessage) {
        payload.message = generatedMessage;
      } else {
        // If no AI message, use the input as the message
        payload.message = data.input;
      }

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
      setGeneratedMessage('');
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

  const regenerateMessage = async () => {
    const values = getValues();
    const structuredInput = `Event Title: ${values.title}\nDate: ${values.date}\nTime: ${values.time}\nDetails: ${values.input}`;

    try {
      const messageResponse = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: structuredInput, tone: values.tone }),
      });

      const { message } = await messageResponse.json();
      setGeneratedMessage(message);
    } catch (error) {
      toast.error(
        `Failed to regenerate message: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return (
    <div className="max-w-xl p-8 mx-auto mt-6 space-y-8 bg-white border shadow-sm rounded-xl">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Create a New Event</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details and we&apos;ll handle the rest.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* Event Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title', { required: true })}
              placeholder="e.g. Birthday Dinner"
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input type="date" id="date" {...register('date', { required: true })} />
              {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
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

        {/* Guests Section (above AI) */}
        <div className="space-y-2">
          <Label htmlFor="guests">Friends to notify</Label>
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

        {/* What's happening in your world? */}
        <div className="space-y-2">
          <Label htmlFor="input">Event details</Label>
          <Textarea
            id="input"
            {...register('input')}
            rows={3}
            placeholder="This will be sent as the message to your friends, or used as the AI prompt if you choose AI to help below."
          />
          {errors.input && <p className="mt-1 text-sm text-red-500">{errors.input.message}</p>}
        </div>

        {/* AI Assisted Help (optional) */}
        <div className="pt-6 space-y-4 border-t">
          <h2 className="text-lg font-semibold">AI Help (we all need it sometimes!)</h2>
          <Label htmlFor="tone">Tone</Label>
          <div className="space-y-2">
            <select
              id="tone"
              className="w-full p-2 border rounded-md border-input"
              defaultValue="friendly"
            >
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="apologetic">Apologetic</option>
            </select>
          </div>
          {/* Group/Single radio buttons for AI message mode */}
          <Label htmlFor="messageMode">How many friends are you sending this to?</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="messageMode"
                value="group"
                checked={messageMode === 'group'}
                onChange={() => setMessageMode('group')}
              />
              A Group
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="messageMode"
                value="single"
                checked={messageMode === 'single'}
                onChange={() => setMessageMode('single')}
              />
              One
            </label>
          </div>
          <Button
            type="button"
            onClick={handleGenerateMessage}
            variant="secondary"
            className="mt-2"
            disabled={!getValues('title') || !getValues('date') || !getValues('time')}
          >
            Generate Message
          </Button>
          {(generatedMessage || personalizedMessages.length > 0) && (
            <div className="pt-4 space-y-4">
              <Label className="text-sm font-medium">AI Generated Message (editable)</Label>
              {messageMode === 'single' && personalizedMessages.length > 0 ? (
                personalizedMessages.map((pm, idx) => (
                  <div key={pm.name} className="p-4 border rounded-md bg-muted">
                    <div className="font-semibold">{pm.name}</div>
                    <MessagePreview
                      message={pm.message}
                      editable
                      onChange={val =>
                        setPersonalizedMessages(msgs =>
                          msgs.map((m, i) => (i === idx ? { ...m, message: val } : m))
                        )
                      }
                    />
                  </div>
                ))
              ) : (
                <MessagePreview
                  message={generatedMessage}
                  onChange={setGeneratedMessage}
                  editable
                />
              )}
              <Button
                type="button"
                onClick={regenerateMessage}
                variant="secondary"
                className="mt-2"
              >
                Regenerate Message
              </Button>
            </div>
          )}
        </div>

        {/* Create Event button, spaced from Generate Message */}
        <div className="flex flex-wrap gap-3 mt-10">
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              (messageMode === 'group' && !generatedMessage) ||
              (messageMode === 'single' && personalizedMessages.length === 0)
            }
            variant="default"
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
}
