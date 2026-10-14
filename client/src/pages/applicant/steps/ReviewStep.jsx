import { formatDate, percent, titleCase } from '../../../utils/format.js';

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value || '—'}</dd>
    </div>
  );
}

function Block({ title, children, onEdit }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-xs font-medium text-brand-700 hover:underline">
            Edit
          </button>
        )}
      </div>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </div>
  );
}

export default function ReviewStep({ values, courses, onEditStep }) {
  const { personal = {}, address = {}, academics = {}, coursePreferences = [] } = values;
  const subjects = academics.subjects || [];
  const totals = subjects.reduce(
    (acc, s) => ({ max: acc.max + Number(s.maxMarks || 0), got: acc.got + Number(s.obtained || 0) }),
    { max: 0, got: 0 },
  );
  const pct = totals.max ? (totals.got / totals.max) * 100 : 0;

  return (
    <div className="space-y-4">
      <Block title="Personal details" onEdit={() => onEditStep(0)}>
        <Row label="Father's name" value={personal.fatherName} />
        <Row label="Mother's name" value={personal.motherName} />
        <Row label="Date of birth" value={formatDate(personal.dob)} />
        <Row label="Gender" value={titleCase(personal.gender || '')} />
        <Row label="Category" value={personal.category} />
        <Row label="Nationality" value={personal.nationality} />
      </Block>

      <Block title="Address" onEdit={() => onEditStep(1)}>
        <Row label="Street" value={[address.line1, address.line2].filter(Boolean).join(', ')} />
        <Row label="City" value={address.city} />
        <Row label="State" value={address.state} />
        <Row label="PIN code" value={address.pincode} />
      </Block>

      <Block title="Academics" onEdit={() => onEditStep(2)}>
        <Row label="Board" value={academics.board} />
        <Row label="School" value={academics.schoolName} />
        <Row label="Year of passing" value={academics.yearOfPassing} />
        <Row label="Subjects" value={`${subjects.length} entered`} />
        <Row label="Percentage" value={percent(pct)} />
      </Block>

      <Block title="Course preferences" onEdit={() => onEditStep(3)}>
        {coursePreferences.length ? (
          coursePreferences.map((pref, i) => {
            const course = courses.find((c) => c.id === pref.course);
            return <Row key={pref.course} label={`Preference ${i + 1}`} value={course ? `${course.code} — ${course.name}` : '—'} />;
          })
        ) : (
          <Row label="Preferences" value="None selected" />
        )}
      </Block>
    </div>
  );
}
