import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { inr } from '../utils/pricing.js';
import { loadRazorpay } from '../utils/loadRazorpay.js';

const EMPTY = { name: '', email: '', phone: '', address: '', city: '', pincode: '' };

export default function Checkout() {
  const { items, subtotal, shipping, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [method, setMethod] = useState('COD'); // 'COD' | 'RAZORPAY'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div className="empty">
        <h2>Your cart is empty</h2>
        <Link className="btn" to="/">Browse the shop</Link>
      </div>
    );
  }

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Opens the Razorpay modal. Resolves with the internal order id once the SERVER has verified the signature.
  async function payOnline(payload) {
    const loaded = await loadRazorpay();
    if (!loaded) throw new Error('Could not load Razorpay. Check your internet connection and try again.');

    const order = await api.post('/payment/create-order', payload);

    return new Promise((resolve, reject) => {
      let verifying = false;

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'Kadai & Co.',
        description: 'Pantry order',
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#B8281A' },
        handler: async (response) => {
          verifying = true;
          try {
            // response = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
            const result = await api.post('/payment/verify-payment', response);
            resolve(result.orderId);
          } catch (err) {
            reject(
              err.status === 0 || err.status >= 500
                ? new Error('We could not confirm your payment yet. If money was deducted, your order will be confirmed shortly.')
                : err
            );
          }
        },
        modal: {
          ondismiss: () => {
            if (!verifying) reject(new Error('Payment cancelled. Your cart is saved, so you can try again.'));
          },
        },
      });

      // The modal stays open after a failure so the customer can retry inside it.
      rzp.on('payment.failed', (resp) => {
        setError(`Payment failed: ${resp.error?.description || 'please try another method'}.`);
      });

      rzp.open();
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);

    const payload = {
      items: items.map((i) => ({ productId: i.product._id, qty: i.qty })),
      customer: form,
    };

    try {
      let orderId;
      if (method === 'COD') {
        ({ orderId } = await api.post('/orders/cod', payload));
      } else {
        orderId = await payOnline(payload);
      }
      clear();
      navigate(`/order/${orderId}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const field = (name, label, props = {}) => (
    <label className={props.wide ? 'wide' : ''}>
      {label}
      <input name={name} value={form[name]} onChange={onChange} required {...props.input} />
    </label>
  );

  return (
    <form className="two-col" onSubmit={onSubmit}>
      <section>
        <h2>Delivery details</h2>
        <div className="fields">
          {field('name', 'Full name', { input: { autoComplete: 'name' } })}
          {field('email', 'Email', { input: { type: 'email', autoComplete: 'email' } })}
          {field('phone', 'Phone (10 digits)', { input: { inputMode: 'numeric', maxLength: 10, pattern: '\\d{10}', autoComplete: 'tel' } })}
          {field('pincode', 'PIN code', { input: { inputMode: 'numeric', maxLength: 6, pattern: '\\d{6}', autoComplete: 'postal-code' } })}
          {field('address', 'Address', { wide: true, input: { autoComplete: 'street-address' } })}
          {field('city', 'City', { input: { autoComplete: 'address-level2' } })}
        </div>

        <h2>Payment</h2>
        <div className="methods" role="radiogroup" aria-label="Payment method">
          <label className={`method ${method === 'COD' ? 'on' : ''}`}>
            <input type="radio" name="method" checked={method === 'COD'} onChange={() => setMethod('COD')} />
            <span><strong>Cash on delivery</strong><small>Pay when your order arrives.</small></span>
          </label>
          <label className={`method ${method === 'RAZORPAY' ? 'on' : ''}`}>
            <input type="radio" name="method" checked={method === 'RAZORPAY'} onChange={() => setMethod('RAZORPAY')} />
            <span><strong>Pay online</strong><small>UPI, cards, netbanking and wallets through Razorpay.</small></span>
          </label>
        </div>
      </section>

      <aside className="summary">
        <h3>Order summary</h3>
        {items.map(({ product, qty }) => (
          <div className="sum" key={product._id}><span>{product.name} x {qty}</span><span>{inr(product.price * qty)}</span></div>
        ))}
        <div className="sum"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
        <div className="sum"><span>Delivery</span><span>{shipping ? inr(shipping) : 'Free'}</span></div>
        <div className="sum total"><span>Total</span><span>{inr(total)}</span></div>
        {error && <p className="alert" role="alert">{error}</p>}
        <button className="btn block" type="submit" disabled={busy}>
          {busy ? 'Please wait...' : method === 'COD' ? 'Place order' : `Pay ${inr(total)}`}
        </button>
      </aside>
    </form>
  );
}
