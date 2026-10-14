import { useFieldArray } from 'react-hook-form';
import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';
import Button from '../../../components/common/Button.jsx';

const BOARDS = ['CBSE', 'ICSE', 'State Board - Karnataka', 'State Board - Tamil Nadu', 'State Board - Maharashtra', 'NIOS', 'Other'];

export default function AcademicsStep({ register, errors, control, watch }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'academics.subjects' });
  const subjects = watch('academics.subjects') || [];

  const totals = subjects.reduce(
    (acc, s) => ({ max: acc.max + Number(s?.maxMarks || 0), got: acc.got + Number(s?.obtained || 0) }),
    { max: 0, got: 0 },
  );
  const percentage = totals.max ? ((totals.got / totals.max) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Board" required options={BOARDS} {...register('academics.board')} error={errors?.academics?.board?.message} />
        <Input
          label="School name"
          required
          {...register('academics.schoolName')}
          error={errors?.academics?.schoolName?.message}
        />
        <Input
          label="Year of passing"
          type="number"
          required
          {...register('academics.yearOfPassing')}
          error={errors?.academics?.yearOfPassing?.message}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Qualifying exam marks</h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => append({ name: '', maxMarks: 100, obtained: 0 })}
            disabled={fields.length >= 10}
          >
            + Add subject
          </Button>
        </div>

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 items-end gap-2">
              <Input
                className="col-span-6 sm:col-span-6"
                label={index === 0 ? 'Subject' : undefined}
                placeholder="Mathematics"
                {...register(`academics.subjects.${index}.name`)}
              />
              <Input
                className="col-span-3 sm:col-span-2"
                type="number"
                label={index === 0 ? 'Max' : undefined}
                {...register(`academics.subjects.${index}.maxMarks`)}
              />
              <Input
                className="col-span-2 sm:col-span-3"
                type="number"
                label={index === 0 ? 'Obtained' : undefined}
                {...register(`academics.subjects.${index}.obtained`)}
              />
              <Button className="col-span-1" size="sm" variant="ghost" onClick={() => remove(index)} aria-label="Remove">
                ✕
              </Button>
            </div>
          ))}
          {!fields.length && (
            <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
              Add each subject from your qualifying examination.
            </p>
          )}
        </div>

        {errors?.academics?.subjects?.message && <p className="field-error">{errors.academics.subjects.message}</p>}

        <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3">
          <span className="text-sm text-brand-800">Computed percentage</span>
          <span className="text-lg font-semibold text-brand-800">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}
