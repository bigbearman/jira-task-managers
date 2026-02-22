import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-8 w-24" />
      {/* Form sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="space-y-4">
            <div>
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div>
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </div>
      ))}
      <Skeleton className="h-10 w-24" />
    </div>
  );
}
