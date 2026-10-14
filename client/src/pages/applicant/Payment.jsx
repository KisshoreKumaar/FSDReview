import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as paymentApi from '../../api/payment.api.js';
import { apiMessage } from '../../api/client.js';
import { formatDateTime, formatRupees } from '../../utils/format.js';
import SectionCard from '../../components/common/SectionCard.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Button from '../../components/common/Button.jsx';
import { loadRazorpayCheckout } from '../../utils/razorpay.js';

export default function Payment() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = useCallback(
    () =>
      paymentApi
        .getMyPayment()
        .then(setState)
        .catch((err) => toast.error(apiMessage(err, 'Could not load the payment status'))),
    [],
  );

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const pay = async () => {
    setPaying(true);
    try {
      const { order, keyId, mockMode, alreadyPaid } = await paymentApi.createOrder();
      if (alreadyPaid) {
        toast.success('Fee already paid');
        await load();
        return;
      }

      if (mockMode) {
        await paymentApi.confirmPayment({ razorpayOrderId: order.id });
        toast.success('Payment successful (mock gateway)');
        await load();
        return;
      }

      const Razorpay = await loadRazorpayCheckout();
      const checkout = new Razorpay({
        key: keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: 'College Admissions',
        description: 'Application fee',
        handler: async (response) => {
          try {
            await paymentApi.confirmPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful');
            await load();
          } catch (err) {
            toast.error(apiMessage(err, 'Payment verification failed'));
          }
        },
        theme: { color: '#2546eb' },
      });
      checkout.open();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not start the payment'));
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Spinner label="Loading payment…" />;

  const payment = state?.payment;
  const paid = payment?.status === 'PAID';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Application fee</h1>
        <p className="text-sm text-slate-500">A one-time non-refundable fee for the 2026–27 admission cycle.</p>
      </div>

      <SectionCard title="Fee summary">
        <dl className="divide-y divide-slate-100 text-sm">
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Application processing fee</dt>
            <dd className="font-medium text-slate-800">{formatRupees(state?.fee)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Status</dt>
            <dd className={`font-medium ${paid ? 'text-emerald-600' : 'text-amber-600'}`}>
              {paid ? 'Paid' : payment?.status === 'FAILED' ? 'Failed' : 'Not paid'}
            </dd>
          </div>
          {paid && (
            <>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Reference</dt>
                <dd className="font-mono text-xs text-slate-700">{payment.razorpayPaymentId}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Paid on</dt>
                <dd className="text-slate-700">{formatDateTime(payment.paidAt)}</dd>
              </div>
            </>
          )}
        </dl>

        {state?.mockMode && !paid && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Razorpay keys are not configured, so the gateway runs in <b>mock mode</b> — clicking pay marks the fee as
            received without charging anything. Add <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code>{' '}
            to use the real test checkout.
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Link to="/app/documents"><Button variant="secondary">Back to documents</Button></Link>
          {paid ? (
            <Link to="/app/status"><Button>Go to submission</Button></Link>
          ) : (
            <Button loading={paying} onClick={pay}>
              Pay {formatRupees(state?.fee)}
            </Button>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
