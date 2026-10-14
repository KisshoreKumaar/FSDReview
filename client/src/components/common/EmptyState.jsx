export default function EmptyState({ title = 'Nothing to show', body, action, icon = '📄' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="text-3xl" aria-hidden>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {body && <p className="max-w-sm text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
