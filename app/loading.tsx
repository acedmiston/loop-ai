import Skeleton from '@/components/Skeleton';

export default function GlobalLoading() {
  return (
    <div className="max-w-2xl p-6 mx-auto">
      <div className="space-y-4">
        <Skeleton className="w-1/3 h-8" />
        <Skeleton className="w-2/3 h-5" />
        <Skeleton className="w-full h-16" />
        <Skeleton className="w-full h-16" />
        <Skeleton className="w-1/2 h-10" />
      </div>
    </div>
  );
}
