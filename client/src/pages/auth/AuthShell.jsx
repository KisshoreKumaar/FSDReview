import { Link } from 'react-router-dom';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-brand-700 p-10 text-white lg:flex">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">CA</span>
          College Admissions
        </Link>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            One portal for the whole
            <br />
            admission cycle.
          </h2>
          <ul className="mt-6 space-y-2 text-sm text-brand-100">
            <li>• Apply online and save your draft as you go</li>
            <li>• Upload certificates once, track verification live</li>
            <li>• Pay the fee securely and get an instant receipt</li>
            <li>• See your merit rank the moment the list is published</li>
          </ul>
        </div>
        <p className="text-xs text-brand-200">Admission cycle 2026–27 · Demo environment</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-sm text-slate-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
