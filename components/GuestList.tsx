'use client';

import { useState } from 'react';

export default function GuestList({
  guests,
  onAddGuest,
}: {
  guests: string[];
  onAddGuest: (phone: string) => void;
}) {
  const [phone, setPhone] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && !guests.includes(phone)) {
      onAddGuest(phone.trim());
      setPhone('');
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Add guest phone"
          className="flex-1 p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded">
          Add
        </button>
      </form>

      <ul className="pl-5 text-sm list-disc">
        {guests.map((guest, idx) => (
          <li key={idx}>{guest}</li>
        ))}
      </ul>
    </div>
  );
}
