export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 animate-pulse rounded w-96" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 animate-pulse rounded" />
    </div>
  )
}
