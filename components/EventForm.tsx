'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import MessagePreview from './MessagePreview';
import GuestSelector from './GuestSelector';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type FormData = {
  title: string;
  date: string;
  time: string;
  input: string;
  tone: string;
};

export default function EventForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormData>();

  // Load saved form values on mount
  useEffect(() => {
    const saved = localStorage.getItem('event-form');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach(key => {
        setValue(key as keyof FormData, parsed[key]);
      });
    }
  }, [setValue]);

  // Watch and save form to localStorage
  useEffect(() => {
    const subscription = watch(value => {
      localStorage.setItem('event-form', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleGenerateMessage = async () => {
    const values = getValues();

    if (!values.title || !values.date || !values.time) {
      toast.error('Please fill in title, date, and time before generating a message.');
      return;
    }

    const structuredInput = `Event Title: ${values.title}\nDate: ${values.date}\nTime: ${values.time}\nDetails: ${values.input}`;

    try {
      const messageResponse = await fetch('/api/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: structuredInput,
          tone: values.tone,
        }),
      });

      const { message } = await messageResponse.json();
      setGeneratedMessage(message);
    } catch (error) {
      toast.error(
        `Failed to generate message: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    if (selectedGuests.length === 0) {
      toast.error('Please add at least one guest.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          message: generatedMessage,
          guests: selectedGuests,
        }),
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
    <div className="max-w-xl p-8 mx-auto mt-6 space-y-6 bg-white border shadow-sm rounded-xl">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Create a New Event</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details and we&apos;ll handle the rest.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title', { required: true })}
              placeholder="e.g. Birthday Dinner"
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">Title is required.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input type="date" id="date" {...register('date', { required: true })} />
              {errors.date && <p className="mt-1 text-sm text-red-500">Date is required.</p>}
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

          <div className="space-y-2">
            <Label htmlFor="input">What&apos;s going on in your life?</Label>
            <Textarea
              id="input"
              {...register('input')}
              rows={3}
              placeholder="What would you like to share with your guests?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <select
              id="tone"
              {...register('tone')}
              className="w-full p-2 border rounded-md border-input"
              defaultValue="friendly"
            >
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="apologetic">Apologetic</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">Guests to notify</Label>
            <div className="p-2 border rounded-md border-input">
              <GuestSelector selected={selectedGuests} setSelected={setSelectedGuests} />
            </div>
          </div>
        </div>

        {!generatedMessage && (
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleGenerateMessage}
              variant="default"
              disabled={!getValues('title') || !getValues('date') || !getValues('time')}
            >
              Generate Message
            </Button>
          </div>
        )}

        {generatedMessage && (
          <div className="pt-4 space-y-4">
            <div className="p-4 border rounded-md bg-muted">
              <Label className="text-sm font-medium">Message Preview</Label>
              <MessagePreview message={generatedMessage} />
            </div>
            <Button type="button" onClick={regenerateMessage} variant="secondary">
              Regenerate Message
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-6">
          <Button type="submit" disabled={isSubmitting || !generatedMessage} variant="default">
            {isSubmitting ? 'Creating...' : 'Create Event & Notify Guests'}
          </Button>
        </div>
      </form>
    </div>
  );
}
