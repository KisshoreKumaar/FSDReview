import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import SectionCard from '../components/common/SectionCard.jsx';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatDateTime } from '../utils/format.js';

export default function Notifications() {
  const { notifications, unread, readOne, readAll, connected } = useSocket();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">
            {unread} unread · live updates {connected ? 'connected' : 'reconnecting…'}
          </p>
        </div>
        {unread > 0 && <Button variant="secondary" onClick={readAll}>Mark all read</Button>}
      </div>

      <SectionCard>
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            body="Status changes, document decisions, payments and merit publications land here."
            icon="🔔"
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li key={n._id} className={`flex gap-3 py-3 ${n.isRead ? 'opacity-60' : ''}`}>
                <span className="mt-1 text-lg" aria-hidden>{n.isRead ? '📭' : '📬'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  {n.link && (
                    <Link to={n.link}>
                      <Button size="sm" variant="secondary">Open</Button>
                    </Link>
                  )}
                  {!n.isRead && (
                    <Button size="sm" variant="ghost" onClick={() => readOne(n._id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
