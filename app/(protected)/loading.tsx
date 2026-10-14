/** Shared skeleton while route data and the organization scope load. */
export default function Loading() {
  return <main className="space-y-6" aria-label="Đang tải dữ liệu" aria-busy="true">
    <div className="space-y-3"><div className="skeleton-block h-3 w-32 rounded"/><div className="skeleton-block h-9 w-64 max-w-full rounded-lg"/><div className="skeleton-block h-4 w-80 max-w-full rounded"/></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><div className="skeleton-block col-span-2 h-36 rounded-2xl"/><div className="skeleton-block h-36 rounded-2xl"/><div className="skeleton-block h-36 rounded-2xl"/></div>
    <div className="grid gap-4 lg:grid-cols-2"><div className="skeleton-block h-64 rounded-2xl"/><div className="skeleton-block h-64 rounded-2xl"/></div>
    <span className="sr-only">Đang tải dữ liệu, vui lòng chờ trong giây lát.</span>
  </main>;
}
