import Select from '../../../components/common/Select.jsx';

const MAX_PREFERENCES = 3;

export default function PreferencesStep({ courses, value = [], onChange, error }) {
  const selected = Array.from({ length: MAX_PREFERENCES }, (_, i) => value[i]?.course || '');

  const setAt = (index, courseId) => {
    const next = [...selected];
    next[index] = courseId;
    onChange(
      next
        .map((course, i) => (course ? { course, priority: i + 1 } : null))
        .filter(Boolean)
        .map((p, i) => ({ ...p, priority: i + 1 })),
    );
  };

  const optionsFor = (index) =>
    courses
      .filter((c) => !selected.some((s, i) => s === c.id && i !== index))
      .map((c) => ({
        value: c.id,
        label: `${c.code} — ${c.name} (${c.degreeLevel}, ${c.totalSeats - c.seatsFilled} seats left)`,
      }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Pick up to {MAX_PREFERENCES} courses in order of preference. Merit is computed against each course you choose.
      </p>

      {selected.map((courseId, index) => (
        <Select
          key={index}
          label={`Preference ${index + 1}${index === 0 ? ' (required)' : ''}`}
          required={index === 0}
          value={courseId}
          onChange={(e) => setAt(index, e.target.value)}
          options={optionsFor(index)}
          placeholder="— none —"
        />
      ))}

      {error && <p className="field-error">{error}</p>}

      {value.length > 0 && (
        <div className="rounded-lg bg-slate-50 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your order</h4>
          <ol className="mt-2 space-y-1 text-sm text-slate-700">
            {value.map((pref, i) => {
              const course = courses.find((c) => c.id === pref.course);
              return (
                <li key={pref.course}>
                  {i + 1}. {course ? `${course.code} — ${course.name}` : 'Unknown course'}
                  {course && (
                    <span className="ml-2 text-xs text-slate-500">
                      cut-off (General) {course.cutOff?.general ?? 0}%
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
