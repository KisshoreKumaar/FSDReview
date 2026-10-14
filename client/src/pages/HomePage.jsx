import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCourses } from '../api/course.api.js';
import Button from '../components/common/Button.jsx';
import Skeleton from '../components/common/Skeleton.jsx';

export default function HomePage() {
  const [courses, setCourses] = useState(null);

  useEffect(() => {
    listCourses()
      .then((d) => setCourses(d.courses))
      .catch(() => setCourses([]));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
        <span className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">CA</span>
          College Admissions
        </span>
        <div className="flex gap-2">
          <Link to="/results"><Button variant="ghost" size="sm">Results</Button></Link>
          <Link to="/login"><Button variant="secondary" size="sm">Sign in</Button></Link>
          <Link to="/register"><Button size="sm">Apply now</Button></Link>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-14 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Admission cycle 2026–27</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              Apply, upload, pay and track — without a single trip to campus.
            </h1>
            <p className="mt-3 max-w-xl text-slate-600">
              One portal for the whole admission cycle: a guided application form, document verification you can
              follow live, secure fee payment and merit results the moment they are published.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register"><Button size="lg">Start your application</Button></Link>
              <Link to="/results"><Button size="lg" variant="secondary">View published results</Button></Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
          <h2 className="text-lg font-semibold text-slate-900">Courses on offer</h2>
          <p className="mt-1 text-sm text-slate-600">Seats and eligibility for this cycle.</p>

          {courses === null ? (
            <div className="mt-5"><Skeleton.Cards count={6} /></div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <article key={course.id} className="card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{course.name}</h3>
                    <span className="rounded bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                      {course.degreeLevel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {course.code} · {course.department} · {course.durationYears} years
                  </p>
                  <dl className="mt-4 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <dt>Seats</dt>
                      <dd className="font-medium text-slate-800">
                        {course.totalSeats - course.seatsFilled} of {course.totalSeats} left
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Minimum eligibility</dt>
                      <dd className="font-medium text-slate-800">{course.eligibility?.minPercentage}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Cut-off (General)</dt>
                      <dd className="font-medium text-slate-800">{course.cutOff?.general}%</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-500 sm:px-8">
          Online College Admission Management System · demo environment · admissions@college.test
        </footer>
      </main>
    </div>
  );
}
