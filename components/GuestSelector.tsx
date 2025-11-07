'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Guest } from '@/types/event';
import AddContactModal from '@/components/AddContactModal';
import 'react-phone-input-2/lib/style.css';

type GuestSelectorProps = {
  guests: Guest[];
  selected: string[];
  setSelected: (phones: string[]) => void;
  fetchGuests: () => Promise<void>;
};

export default function GuestSelector({
  selected,
  setSelected,
  guests,
  fetchGuests,
}: GuestSelectorProps) {
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

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
          placeholder="Search friends..."
        />
        {query && (
          <ul className="absolute z-10 w-full p-2 mt-1 space-y-1 overflow-auto transition-all duration-200 bg-white border rounded-md shadow max-h-40">
            {filtered.map((guest, index) => (
              <li
                key={guest.id}
                onClick={() => {
                  toggleSelect(guest.phone);
                  setQuery(''); // Close the dropdown when a user is clicked
                }}
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
        <AddContactModal
          onAddContact={async contact => {
            try {
              const res = await fetch('/api/guests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  first_name: contact.firstName,
                  last_name: contact.lastName,
                  phone: contact.phone,
                }),
              });
              if (!res.ok) {
                toast.error('Failed to save guest. This phone number may already be in use.');
                return;
              }
              const { success } = await res.json();
              if (success) {
                await fetchGuests();
                setSelected([...selected, contact.phone]);
              } else {
                toast.error('Failed to save guest. This phone number may already be in use.');
              }
            } catch (error) {
              console.error('Error saving guest:', error);
              toast.error('Something went wrong while saving this guest.');
            }
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
