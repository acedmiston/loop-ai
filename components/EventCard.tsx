'use client';

import React from 'react';
import { Event } from '@/types/event';
import { format, formatDistanceToNow } from 'date-fns';

type EventCardProps = {
  event: Event;
};

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="p-6 space-y-3 transition-shadow bg-white border rounded-lg shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-600">{event.title}</h3>
        <span className="px-2 py-1 text-xs text-gray-500 bg-white rounded-full">
          {event.createdAt
            ? formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })
            : 'Recently'}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        {event.date && (
          <p>
            <strong>Date:</strong> {format(new Date(event.date), 'PPP')}
          </p>
        )}
        {event.time && (
          <p>
            <strong>Time:</strong> {event.time}
          </p>
        )}
        <p>
          <strong>Tone:</strong> {event.tone}
        </p>
        <p>
          <strong>Guests:</strong> {event.guests.length}
        </p>
      </div>

      <div className="pt-2 text-sm text-gray-800 border-t">{event.message}</div>

      <div className="flex justify-end">
        <button className="text-xs text-blue-600 hover:underline">Resend notifications</button>
      </div>
    </div>
  );
}
