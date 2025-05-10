import { useState } from 'react';
import { Guest } from '@/types/event';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useUser } from '@/lib/user-context';

interface SendTextModalProps {
  open: boolean;
  onClose: () => void;
  guests: Guest[];
  defaultMessage?: string;
}

export default function SendTextModal({
  open,
  onClose,
  guests,
  defaultMessage = '',
  eventId,
}: SendTextModalProps & { eventId?: string }) {
  const [selectedPhones, setSelectedPhones] = useState<string[]>(guests.map(g => g.phone));
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('whatsapp');
  const { user } = useUser();

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setSuccess(false);
    try {
      for (const guest of guests.filter(
        (g: Guest) =>
          selectedPhones.includes(g.phone) && !g.opted_out && g.id && eventId && user?.id
      )) {
        // Prefer first_name, then name, then fallback
        const guestName = guest.first_name || guest.name || 'friend';
        const personalizedMessage = message.replace(/\[Name\]/g, guestName);
        let to = guest.phone;
        if (channel === 'whatsapp') {
          to = `whatsapp:${guest.phone.replace(/[^\d+]/g, '')}`;
        }
        const res = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, body: personalizedMessage, channel }),
        });
        if (!res.ok) throw new Error('Failed to send to ' + guest.phone);
        const { sid } = await res.json();
        // Log the sent message (ensure all required fields are present)
        const logPayload = {
          event_id: eventId,
          guest_id: guest.id,
          to_phone: guest.phone,
          from_user_id: user?.id,
          message_body: personalizedMessage,
          channel,
          twilio_sid: sid,
          status: 'sent',
        };
        // Debug log
        console.log('Logging sent message:', logPayload);
        await fetch('/api/log-sent-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logPayload),
        });
      }
      setSuccess(true);
      onClose(); // Close modal after successful send
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
    setSending(false);
  };

  // Close modal if user clicks outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  // For preview, use the first selected guest or fallback
  const previewGuest = guests.find(g => selectedPhones.includes(g.phone)) || guests[0] || {};
  const previewName = previewGuest.first_name || previewGuest.name || 'friend';
  const previewMessage = message.replace(/\[Name\]/g, previewName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute text-2xl text-gray-400 top-2 right-3 hover:text-gray-700"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="mb-4 text-xl font-bold">Send Text Message</h2>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Recipients</label>
          <div className="flex flex-wrap gap-2">
            {guests.map(g => (
              <label
                key={g.phone}
                className={`flex items-center gap-1 text-sm ${g.opted_out ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={g.opted_out ? 'This guest has opted out and cannot receive messages.' : ''}
              >
                <input
                  type="checkbox"
                  checked={selectedPhones.includes(g.phone)}
                  onChange={e => {
                    setSelectedPhones(phones =>
                      e.target.checked ? [...phones, g.phone] : phones.filter(p => p !== g.phone)
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
          {guests.some(g => selectedPhones.includes(g.phone) && g.opted_out) && (
            <div className="mt-2 text-xs text-red-600">
              Some selected guests have opted out and will not receive messages.
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Message</label>
          <div className="mb-2 text-xs text-gray-500">
            (For your last minute edits before sending, just don&apos;t remove{' '}
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
            <div className="text-sm text-gray-700">{previewMessage}</div>
          </div>
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Messaging Channel</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="channel"
                value="whatsapp"
                checked={channel === 'whatsapp'}
                onChange={() => setChannel('whatsapp')}
              />
              WhatsApp
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="channel"
                value="sms"
                checked={channel === 'sms'}
                onChange={() => setChannel('sms')}
                disabled
              />
              <div className="text-sm text-gray-500 "> SMS (Coming soon!)</div>
            </label>
          </div>
        </div>
        {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
        {success && <div className="mb-2 text-sm text-green-600">Message sent!</div>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || selectedPhones.length === 0 || !message.trim()}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
