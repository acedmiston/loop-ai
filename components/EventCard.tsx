'use client';
import { Event } from '@/types/event';
import { DateTime } from 'luxon';
import Image from 'next/image';
import { MapPin } from 'lucide-react';

/** Time format: lowercase with no space (e.g. 8:00pm) */
function formatTime(timeStr: string) {
  return DateTime.fromFormat(timeStr, 'HH:mm').toFormat('h:mma').toLowerCase();
}

/** Address parts without country (e.g. drop "United States" or "United", "States") */
function addressWithoutCountry(location: string): string[] {
  const parts = location.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return [];
  const last = parts[parts.length - 1];
  if (/^United States$|^USA$|^U\.?S\.?A\.?$/i.test(last)) return parts.slice(0, -1);
  if (parts.length >= 2 && parts[parts.length - 2] === 'United' && parts[parts.length - 1] === 'States') return parts.slice(0, -2);
  return parts;
}

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
    <div className="p-8 space-y-4 transition-shadow bg-white border rounded-lg shadow-sm hover:shadow-md h-[500px] flex flex-col w-full min-w-[300px] max-w-[520px] min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
        <h3 className="text-2xl font-semibold leading-tight text-blue-600 min-w-0 truncate" title={event.title}>
          {event.title}
        </h3>
        {!disableActions && (
          <button
            className="px-2 py-1 text-sm text-blue-600 rounded-sm hover:underline outline-1 outline-blue-600 shrink-0 whitespace-nowrap"
            onClick={() => onEdit?.(event)}
            type="button"
          >
            Edit Event
          </button>
        )}
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        {/* Date & time display */}
        {event.date && (
          <div className="space-y-0.5">
            {event.end_date && event.end_date !== event.date ? (
              /* Multi-day: "Thu, Nov 28 · 12:00pm —" / "Sun, Dec 1 · 12:00pm" */
              <>
                <p>
                  <span className="text-base font-medium text-gray-700">
                    {DateTime.fromISO(event.date).toFormat('ccc, MMM d')}
                  </span>
                  {event.start_time && (
                    <span className="text-sm text-gray-500">
                      {' · '}
                      {formatTime(event.start_time)}
                      {' —'}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {DateTime.fromISO(event.end_date).toFormat('ccc, MMM d')}
                  {event.end_time && (
                    <>
                      {' · '}
                      {formatTime(event.end_time)}
                    </>
                  )}
                </p>
              </>
            ) : event.end_time ? (
              /* Single day, start and end: "Thursday, Feb 5" / "7:00pm – 9:00pm" */
              <>
                <p className="text-base font-medium text-gray-700">
                  {DateTime.fromISO(event.date).toFormat('cccc, MMM d')}
                </p>
                <p className="text-sm text-gray-500">
                  {event.start_time
                    ? `${formatTime(event.start_time)} – ${formatTime(event.end_time)}`
                    : formatTime(event.end_time)}
                </p>
              </>
            ) : (
              /* Single day, start time only: "Saturday, Jan 31" / "8:00pm" */
              <>
                <p className="text-base font-medium text-gray-700">
                  {DateTime.fromISO(event.date).toFormat('cccc, MMM d')}
                </p>
                {event.start_time && (
                  <p className="text-sm text-gray-500">{formatTime(event.start_time)}</p>
                )}
              </>
            )}
          </div>
        )}
        {event.location && (
          <div className="flex items-center justify-between gap-2 mt-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <MapPin
                className="shrink-0 mt-0.5 w-4 h-4 text-amber-600"
                aria-hidden
              />
              {event.location_lat && event.location_lng ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${event.location_lat},${event.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 hover:text-amber-800 underline break-words whitespace-pre-line"
                  style={{ wordBreak: 'break-word' }}
                >
                  {addressWithoutCountry(event.location).map((line, idx, arr) => (
                    <span key={idx}>
                      {line}
                      {idx < arr.length - 1 && <br />}
                    </span>
                  ))}
                </a>
              ) : (
                <span
                  className="text-amber-700 break-words whitespace-pre-line"
                  style={{ wordBreak: 'break-word' }}
                >
                  {addressWithoutCountry(event.location).map((line, idx, arr) => (
                    <span key={idx}>
                      {line}
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
                  width={140}
                  height={84}
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${event.location_lng},${event.location_lat})/${event.location_lng},${event.location_lat},15,0/140x84?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`}
                  alt="Map preview"
                  className="rounded shadow border w-[140px] h-[84px] object-cover"
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

      <div className="pt-2 border-t overflow-y-auto flex-1 min-h-[100px] min-w-0">
        <label className="block mb-1 text-sm font-medium ">Message:</label>
        <div className="text-sm">{displayMessage}</div>
        {wasPersonalized && (
          <div className="mt-2 text-xs italic text-blue-500">
            This message was sent as a personal message to each friend with their own name.
          </div>
        )}
      </div>
      <div className="flex justify-between items-center gap-2 mt-2 min-w-0 shrink-0">
        <span className="px-0 py-1 text-sm text-gray-500 bg-white rounded-full min-w-0 truncate">
          Created:{' '}
          {event.createdAt
            ? DateTime.fromISO(event.createdAt).toRelative({ base: DateTime.now() })
            : 'Recently'}
        </span>
        {!disableActions && (
          <button
            className="px-2 py-1 text-xs text-white bg-blue-600 rounded-sm shrink-0 hover:underline"
            onClick={onResend}
          >
            Resend messages
          </button>
        )}
      </div>
    </div>
  );
}
