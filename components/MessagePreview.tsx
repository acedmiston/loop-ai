export default function MessagePreview({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="p-4 bg-white border rounded-md shadow">
      <p className="mb-2 text-sm font-semibold">Generated Message:</p>
      <p>{message}</p>
    </div>
  );
}
