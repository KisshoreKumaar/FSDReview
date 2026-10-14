function Line({ className = '' }) {
  return <div className={`skeleton h-4 ${className}`} />;
}

function Cards({ count = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <Line className="w-1/2" />
          <Line className="h-8 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ columns = 4, rows = 5 }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((__, c) => (
            <Line key={c} className="w-4/5" />
          ))}
        </div>
      ))}
    </div>
  );
}

const Skeleton = { Line, Cards, Table: TableSkeleton };
export default Skeleton;
