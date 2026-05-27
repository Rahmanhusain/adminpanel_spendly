function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-slate-100 ${className}`} />
  );
}

export default function TenantDetailLoading() {
  return (
    <div className="space-y-5">
      {/* Back + refresh row */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      {/* Workspace card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Card header */}
        <div className="border-b border-slate-100 px-5 py-5 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-6 w-44 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-72 rounded" />
            </div>
            <Skeleton className="h-8 w-36 rounded-full" />
          </div>
        </div>

        {/* Users section header */}
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>

        {/* User rows */}
        <ul className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-32 rounded" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded" />
                  </div>
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              </div>
              <Skeleton className="h-7 w-28 rounded-full" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
