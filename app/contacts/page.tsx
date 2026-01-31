'use client';

import { useEffect, useState } from 'react';
import { Guest } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import AddContactModal from '@/components/AddContactModal';
import PageShell from '@/components/PageShell';
import PageHeader from '@/components/PageHeader';

export default function ContactsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Watch this to make sure this works correctly.
  useEffect(() => {
    fetch('/api/guests')
      .then(res => {
        if (!res.ok) {
          console.error('Failed to fetch guests:', res.status);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setGuests(
            (data.guests || []).map((g: Guest) => ({
              ...g,
              firstName: g.first_name,
              lastName: g.last_name,
            }))
          );
        }
      })
      .catch(error => {
        console.error('Error fetching guests:', error);
      });
  }, []);

  const filtered = guests.filter(guest => {
    const fullName = `${guest.first_name || ''} ${guest.last_name || ''}`.toLowerCase();
    return fullName.includes(query.toLowerCase()) || guest.phone.includes(query);
  });

  return (
    <PageShell>
      <PageHeader
        title="My Friends"
        subtitle="Manage your contacts for event invites."
        action={
          <Button onClick={() => setShowModal(true)}>Add a Friend</Button>
        }
      />
      <div className="mb-4">
        <Input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search friends..."
        />
      </div>
      <ul className="space-y-2">
        {filtered.map(guest => (
          <li key={guest.phone} className="flex items-center justify-between py-2 border-b">
            <span>
              {guest.first_name} {guest.last_name} — {guest.phone}
            </span>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/guests?phone=${guest.phone}`, {
                    method: 'DELETE',
                  });
                  if (!res.ok) {
                    toast.error('Failed to ghost friend.');
                    return;
                  }
                  const { success } = await res.json();
                  if (success) {
                    setGuests(prev => prev.filter(g => g.phone !== guest.phone));
                    toast.success('Friend ghosted successfully');
                  } else {
                    toast.error('Failed to ghost friend.');
                  }
                } catch (error) {
                  console.error('Error deleting guest:', error);
                  toast.error('Something went wrong while ghosting this friend.');
                }
              }}
            >
              Delete
            </Button>
          </li>
        ))}
        {filtered.length === 0 && <li className="text-sm text-gray-500">No friends found.</li>}
      </ul>

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
                toast.error('Failed to save this friendship. This phone number may already be in use.');
                return;
              }
              const { success, guest } = await res.json();
              if (success) {
                setGuests(prev => [
                  ...prev,
                  { ...guest, firstName: guest.first_name, lastName: guest.last_name },
                ]);
              } else {
                toast.error('Failed to save this friendship. This phone number may already be in use.');
              }
            } catch (error) {
              console.error('Error adding guest:', error);
              toast.error('Something went wrong while saving this friendship.');
            }
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </PageShell>
  );
}
