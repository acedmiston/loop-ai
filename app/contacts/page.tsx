'use client';

import { useEffect, useState } from 'react';
import { Guest } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ContactsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newGuest, setNewGuest] = useState({ firstName: '', lastName: '', phone: '' });

  useEffect(() => {
    fetch('/api/guests')
      .then(res => res.json())
      .then(data =>
        setGuests(
          (data.guests || []).map((g: any) => ({
            ...g,
            firstName: g.first_name,
            lastName: g.last_name,
          }))
        )
      );
  }, []);

  const filtered = guests.filter(guest => {
    const fullName = `${guest.firstName || ''} ${guest.lastName || ''}`.toLowerCase();
    return fullName.includes(query.toLowerCase()) || guest.phone.includes(query);
  });

  return (
    <div className="max-w-2xl p-6 mx-auto space-y-6 bg-white rounded-lg shadow">
      <h1 className="mb-4 text-2xl font-bold">My Contacts</h1>
      <div className="mb-4">
        <Input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search contacts..."
        />
      </div>
      <ul className="space-y-2">
        {filtered.map(guest => (
          <li key={guest.phone} className="flex items-center justify-between py-2 border-b">
            <span>
              {guest.firstName} {guest.lastName} — {guest.phone}
            </span>
          </li>
        ))}
        {filtered.length === 0 && <li className="text-sm text-gray-500">No contacts found.</li>}
      </ul>
      <Button onClick={() => setShowModal(true)}>Add Contact</Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-md w-[300px] space-y-4">
            <h3 className="text-lg font-semibold">Add New Contact</h3>
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
                onClick={async () => {
                  if (!newGuest.firstName || !newGuest.phone) {
                    toast.error('First name and phone number are required');
                    return;
                  }
                  try {
                    const res = await fetch('/api/guests', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        first_name: newGuest.firstName,
                        last_name: newGuest.lastName,
                        phone: newGuest.phone,
                      }),
                    });
                    const { success, guest } = await res.json();
                    if (success) {
                      setGuests(prev => [
                        ...prev,
                        { ...guest, firstName: guest.first_name, lastName: guest.last_name },
                      ]);
                      setShowModal(false);
                      setNewGuest({ firstName: '', lastName: '', phone: '' });
                    } else {
                      toast.error(
                        'Failed to save contact. This phone number may already be in use.'
                      );
                    }
                  } catch {
                    toast.error('Something went wrong while saving this contact.');
                  }
                }}
              >
                Add Contact
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
