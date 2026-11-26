import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid gap-4 pt-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-28" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </div>
  );
}
