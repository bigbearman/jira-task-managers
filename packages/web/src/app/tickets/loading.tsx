import { Skeleton } from '@/components/ui/skeleton';

export default function TicketsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-48" />
      </div>
      {/* Table header */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-gray-800"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
