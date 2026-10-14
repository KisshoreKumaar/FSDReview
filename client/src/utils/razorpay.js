const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** Loads the Razorpay checkout script once and resolves the global constructor. */
export const loadRazorpayCheckout = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);

    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    const script = existing || document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Could not load the Razorpay checkout'));
    if (!existing) document.body.appendChild(script);
    return undefined;
  });

export default loadRazorpayCheckout;
