'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Guest = {
  id: string;
  first_name?: string;
  last_name?: string;
  phone: string;
};

type Props = {
  selected: string[];
  setSelected: (phones: string[]) => void;
};

export default function GuestSelector({ selected, setSelected }: Props) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [newGuest, setNewGuest] = useState({ firstName: '', lastName: '', phone: '' });

  useEffect(() => {
    fetch('/api/guests')
      .then(res => res.json())
      .then(data => setGuests(data.guests || []));
  }, []);

  const filtered = guests.filter(guest => {
    const fullName = `${guest.first_name || ''} ${guest.last_name || ''}`.toLowerCase();
    return fullName.includes(query.toLowerCase()) || guest.phone.includes(query);
  });

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered]);

  const toggleSelect = (phone: string) => {
    if (selected.includes(phone)) {
      setSelected(selected.filter(p => p !== phone));
    } else {
      setSelected([...selected, phone]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative w-full">
        <Input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              setHighlightedIndex(prev => Math.min(prev + 1, filtered.length - 1));
            } else if (e.key === 'ArrowUp') {
              setHighlightedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && filtered[highlightedIndex]) {
              toggleSelect(filtered[highlightedIndex].phone);
              setQuery('');
            }
          }}
          placeholder="Search guests..."
        />
        {query && (
          <ul className="absolute z-10 w-full p-2 mt-1 space-y-1 overflow-auto transition-all duration-200 bg-white border rounded-md shadow max-h-40">
            {filtered.map((guest, index) => (
              <li
                key={guest.id}
                onClick={() => toggleSelect(guest.phone)}
                className={`cursor-pointer p-2 rounded-md ${
                  selected.includes(guest.phone)
                    ? 'bg-blue-100 font-medium'
                    : highlightedIndex === index
                      ? 'bg-gray-200'
                      : 'hover:bg-gray-100'
                }`}
              >
                {guest.first_name} {guest.last_name} — {guest.phone}
              </li>
            ))}
            {filtered.length === 0 &&
              (query.trim() ? (
                <li
                  onClick={() => setShowModal(true)}
                  className="p-2 text-sm text-blue-600 cursor-pointer hover:underline"
                >
                  ➕ Add new guest
                </li>
              ) : (
                <li className="p-2 text-sm text-gray-500">No matches found.</li>
              ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selected.map(phone => {
            const matchedGuest = guests.find(g => g.phone === phone);
            const label =
              matchedGuest?.first_name || matchedGuest?.last_name
                ? `${matchedGuest.first_name || ''} ${matchedGuest.last_name || ''}`.trim()
                : phone;

            return (
              <span
                key={phone}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 rounded-full"
              >
                {label}
                <button
                  onClick={() => setSelected(selected.filter(p => p !== phone))}
                  className="text-blue-500 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-md w-[300px] space-y-4">
            <h3 className="text-lg font-semibold">Add New Guest</h3>
            <Input
              placeholder="First Name"
              value={newGuest.firstName}
              onChange={e => setNewGuest({ ...newGuest, firstName: e.target.value })}
            />
            <Input
              placeholder="Last Name"
              value={newGuest.lastName}
              onChange={e => setNewGuest({ ...newGuest, lastName: e.target.value })}
            />
            <Input
              placeholder="Phone Number"
              value={newGuest.phone}
              onChange={e => setNewGuest({ ...newGuest, phone: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                formNoValidate
                onClick={async () => {
                  if (!newGuest.firstName || !newGuest.phone) {
                    toast.error('First name and phone number are required');
                    return;
                  }

                  try {
                    const res = await fetch('/api/guests', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        first_name: newGuest.firstName,
                        last_name: newGuest.lastName,
                        phone: newGuest.phone,
                      }),
                    });

                    const { success, guest } = await res.json();

                    if (success) {
                      setSelected([...selected, guest.phone]);
                      setGuests(prev => [...prev, guest]);
                      setShowModal(false);
                      setQuery('');
                      setNewGuest({ firstName: '', lastName: '', phone: '' });
                    } else {
                      toast.error('Failed to save guest. This phone number may already be in use.');
                    }
                  } catch (err) {
                    console.error('API Error:', err);
                    toast.error('Something went wrong while saving this guest.');
                  }
                }}
              >
                Add Guest
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
