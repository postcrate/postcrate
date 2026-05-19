/**
 * Loading state for the email list. Six placeholder rows that match
 * the dimensions of a real row so the layout doesn't shift on hydration.
 */
export function ListSkeleton() {
  return (
    <ul className="flex flex-col">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="border-border/50 flex items-start gap-3 border-b px-4 py-3"
        >
          <span className="mt-2 w-2 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-muted h-3 w-28 rounded" />
              <span className="bg-muted ml-auto h-3 w-10 rounded tabular-nums" />
            </div>
            <span className="bg-muted block h-3 w-3/4 rounded" />
            <span className="bg-muted/60 block h-3 w-1/2 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}
