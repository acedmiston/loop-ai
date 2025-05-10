'use client';

import React from 'react';
import { Event } from '@/types/event';
import { DateTime } from 'luxon';
import Image from 'next/image';

type EventCardProps = {
  event: Event;
  onEdit?: (event: Event) => void;
};

export default function EventCard({
  event,
  onEdit,
  onResend,
  disableActions = false,
}: EventCardProps & { onResend?: () => void; disableActions?: boolean }) {
  // Prepare guest names
  const guestNames = event.guests
    .map(g => [g.first_name, g.last_name].filter(Boolean).join(' ').trim())
    .filter(Boolean);

  const visibleNames = guestNames.slice(0, 3).join(', ');
  const extraCount = guestNames.length - 3;
  const allNames = guestNames.join(', ');

  const firstGuest = event.guests && event.guests.length > 0 ? event.guests[0] : undefined;
  const previewName = firstGuest?.first_name || 'friend';
  const wasPersonalized =
    event.message.includes('[Name]') ||
    event.message.toLowerCase().includes('hi friend') ||
    (event.message.toLowerCase().includes('hi ') && event.guests.length > 1);
  const displayMessage = event.message.replace(/\{\{firstName\}\}/g, previewName);

  return (
    <div className="p-8 space-y-4 transition-shadow bg-white border rounded-lg shadow-sm hover:shadow-md h-[500px] flex flex-col w-full max-w-[520px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold leading-tight text-blue-600">{event.title}</h3>
        {!disableActions && (
          <button
            className="px-2 py-1 text-sm text-blue-600 rounded-sm hover:underline outline-1 outline-blue-600"
            onClick={() => onEdit?.(event)}
            type="button"
          >
            Edit Event
          </button>
        )}
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex gap-4">
          {event.date && (
            <p>
              <strong>Date:</strong>{' '}
              {DateTime.fromISO(event.date).toLocaleString(DateTime.DATE_MED)}
            </p>
          )}
          {event.start_time && (
            <p>
              <strong>Start:</strong>{' '}
              {DateTime.fromFormat(event.start_time, 'HH:mm').toFormat('h:mm a')}
            </p>
          )}
          {event.end_time && (
            <p>
              <strong>End:</strong>{' '}
              {DateTime.fromFormat(event.end_time, 'HH:mm').toFormat('h:mm a')}
            </p>
          )}
        </div>
        {event.location && (
          <div className="flex items-start justify-between gap-4 mt-2">
            <div className="flex flex-col min-w-0 max-w-[90%]">
              <strong>Location:</strong>
              {event.location_lat && event.location_lng ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${event.location_lat},${event.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-blue-600 underline break-words whitespace-pre-line hover:text-blue-800"
                  style={{ wordBreak: 'break-word' }}
                >
                  {event.location.split(',').map((line, idx, arr) => (
                    <span key={idx}>
                      {line.trim()}
                      {idx < arr.length - 1 && <br />}
                    </span>
                  ))}
                </a>
              ) : (
                <span
                  className="mt-1 break-words whitespace-pre-line"
                  style={{ wordBreak: 'break-word' }}
                >
                  {event.location.split(',').map((line, idx, arr) => (
                    <span key={idx}>
                      {line.trim()}
                      {idx < arr.length - 1 && <br />}
                    </span>
                  ))}
                </span>
              )}
            </div>
            {event.location_lat && event.location_lng && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${event.location_lat},${event.location_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Image
                  width={200}
                  height={120}
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${event.location_lng},${event.location_lat})/${event.location_lng},${event.location_lat},15,0/200x120?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`}
                  alt="Map preview"
                  className="rounded shadow border w-[200px] h-[120px] object-cover"
                />
              </a>
            )}
          </div>
        )}
        <div className={'mt-2' + (event.location_lat && event.location_lng ? ' md:mt-4' : '')}>
          <strong>Friends: </strong>
          {guestNames.length === 0 ? (
            <span className="text-gray-400">None</span>
          ) : (
            <span
              title={guestNames.length > 3 ? allNames : undefined}
              className={guestNames.length > 3 ? 'cursor-help underline decoration-dotted' : ''}
            >
              {visibleNames}
              {extraCount > 0 && ` +${extraCount} more`}
            </span>
          )}
        </div>
      </div>

      <div className="pt-2 border-t overflow-y-auto flex-1 min-h-[100px]">
        <label className="block mb-1 text-sm font-medium ">Message:</label>
        <div className="text-sm">{displayMessage}</div>
        {wasPersonalized && (
          <div className="mt-2 text-xs italic text-blue-500">
            This message was sent as a personal message to each friend with their own name.
          </div>
        )}
      </div>
      <div className="flex justify-between mt-2">
        <span className="px-0 py-1 text-xs text-gray-500 bg-white rounded-full">
          Created:{' '}
          {event.createdAt
            ? DateTime.fromISO(event.createdAt).toRelative({ base: DateTime.now() })
            : 'Recently'}
        </span>
        {!disableActions && (
          <button
            className="px-2 py-1 text-xs text-white bg-blue-600 rounded-sm d-sm hover:underline"
            onClick={onResend}
          >
            Resend messages
          </button>
        )}
      </div>
    </div>
  );
}
