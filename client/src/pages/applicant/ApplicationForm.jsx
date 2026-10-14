import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as applicationApi from '../../api/application.api.js';
import { apiMessage } from '../../api/client.js';
import { applicationSchema, STEP_FIELDS, toFormValues } from './applicationSchema.js';
import Button from '../../components/common/Button.jsx';
import Stepper from '../../components/common/Stepper.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import SectionCard from '../../components/common/SectionCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import PersonalStep from './steps/PersonalStep.jsx';
import AddressStep from './steps/AddressStep.jsx';
import AcademicsStep from './steps/AcademicsStep.jsx';
import PreferencesStep from './steps/PreferencesStep.jsx';
import ReviewStep from './steps/ReviewStep.jsx';
import { EDITABLE_STATUSES } from '../../constants/status.js';

const STEPS = ['Personal', 'Address', 'Academics', 'Preferences', 'Review'];

export default function ApplicationForm() {
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [courses, setCourses] = useState([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm({ resolver: zodResolver(applicationSchema), mode: 'onTouched' });
  const { register, control, watch, setValue, trigger, getValues, reset, formState } = form;

  useEffect(() => {
    (async () => {
      try {
        const [{ application: existing }, courseList] = await Promise.all([
          applicationApi.getMyApplication(),
          applicationApi.getCourseOptions(),
        ]);
        const app = existing || (await applicationApi.createApplication());
        setApplication(app);
        setCourses(courseList.map((c) => ({ ...c, id: c.id || c._id })));
        reset(toFormValues(app));
      } catch (err) {
        toast.error(apiMessage(err, 'Could not load your application'));
      } finally {
        setLoading(false);
      }
    })();
  }, [reset]);

  const editable = useMemo(
    () => !application || EDITABLE_STATUSES.includes(application.status),
    [application],
  );

  const persist = async ({ silent = false } = {}) => {
    if (!application || !editable) return null;
    setSaving(true);
    try {
      const { application: saved } = await applicationApi.saveApplication(application._id, getValues());
      setApplication(saved);
      if (!silent) toast.success('Draft saved');
      return saved;
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save the draft'));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    const fields = STEP_FIELDS[step];
    if (fields.length && !(await trigger(fields))) {
      toast.error('Fix the highlighted fields first');
      return;
    }
    await persist({ silent: true });
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  if (loading) return <Spinner label="Loading your application…" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Application form</h1>
          <p className="text-sm text-slate-500">
            {application?.applicationNo} · saved automatically as you move between steps
          </p>
        </div>
        <StatusBadge status={application?.status} />
      </div>

      {!editable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This application is locked in <b>{application.status}</b>. It can only be edited when it is a draft or when
          the verification officer asks for corrections.
        </div>
      )}

      <SectionCard>
        <Stepper steps={STEPS} current={step} onStepClick={setStep} />
      </SectionCard>

      <SectionCard title={`Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`}>
        <fieldset disabled={!editable} className="space-y-4">
          {step === 0 && <PersonalStep register={register} errors={formState.errors} />}
          {step === 1 && <AddressStep register={register} errors={formState.errors} />}
          {step === 2 && (
            <AcademicsStep register={register} errors={formState.errors} control={control} watch={watch} />
          )}
          {step === 3 && (
            <PreferencesStep
              courses={courses}
              value={watch('coursePreferences') || []}
              onChange={(v) => setValue('coursePreferences', v, { shouldValidate: true })}
              error={formState.errors?.coursePreferences?.message}
            />
          )}
          {step === 4 && <ReviewStep values={watch()} courses={courses} onEditStep={setStep} />}
        </fieldset>
      </SectionCard>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        <div className="flex gap-2">
          {editable && (
            <Button variant="secondary" loading={saving} onClick={() => persist()}>
              Save draft
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} loading={saving}>
              Save and continue
            </Button>
          ) : (
            <Button
              onClick={async () => {
                await persist({ silent: true });
                navigate('/app/documents');
              }}
              loading={saving}
            >
              Continue to documents
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
