import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PhoneInput from 'react-phone-input-2';
import { useClickOutside } from '@/lib/useClickOutside';
import 'react-phone-input-2/lib/style.css';

type AddContactModalProps = {
  onAddContact: (contact: { firstName: string; lastName: string; phone: string }) => Promise<void>;
  onClose: () => void;
};

export default function AddContactModal({ onAddContact, onClose }: AddContactModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(modalRef, onClose);

  const [newContact, setNewContact] = useState({ firstName: '', lastName: '', phone: '' });

  const handleAddContact = async () => {
    if (!newContact.firstName || !newContact.phone) {
      toast.error('First name and phone number are required');
      return;
    }
    try {
      await onAddContact(newContact);
      setNewContact({ firstName: '', lastName: '', phone: '' });
      onClose();
    } catch {
      toast.error('Something went wrong while saving this contact.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div ref={modalRef} className="bg-white p-6 rounded-md w-[300px] space-y-4">
        <h3 className="text-lg font-semibold"> Friendship Maker</h3>
        <Input
          placeholder="First Name"
          value={newContact.firstName}
          onChange={e => setNewContact({ ...newContact, firstName: e.target.value })}
        />
        <Input
          placeholder="Last Name"
          value={newContact.lastName}
          onChange={e => setNewContact({ ...newContact, lastName: e.target.value })}
        />
        <PhoneInput
          country={'us'}
          value={newContact.phone}
          onChange={phone => setNewContact({ ...newContact, phone })}
          inputClass="dark:bg-input/30! border-input! flex h-9! w-full! rounded-md! md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAddContact}>
            Add Friend
          </Button>
        </div>
      </div>
    </div>
  );
}
