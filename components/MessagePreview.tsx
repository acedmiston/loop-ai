import { Textarea } from '@/components/ui/textarea';

export default function MessagePreview({
  message,
  onChange,
  editable = false,
}: {
  message: string;
  onChange?: (val: string) => void;
  editable?: boolean;
}) {
  if (!message) return null;

  return (
    <div className="p-4 bg-white border rounded-md shadow">
      <p className="mb-2 text-sm font-semibold">Message Preview:</p>
      {editable && onChange ? (
        <Textarea value={message} onChange={e => onChange(e.target.value)} rows={4} />
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}
