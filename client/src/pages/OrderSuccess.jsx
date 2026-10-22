import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { inr } from '../utils/pricing.js';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="alert">{error}</p>;
  if (!order) return <p className="note">Loading your order...</p>;

  const paid = order.paymentStatus === 'paid';
  return (
    <div className="receipt">
      <h2>{paid ? 'Payment received. Your order is confirmed.' : order.paymentMethod === 'COD' ? 'Order placed.' : 'Waiting for payment confirmation.'}</h2>
      <p className="muted">
        Order {order._id} &middot;{' '}
        {paid
          ? `Paid ${inr(order.total)} online`
          : order.paymentMethod === 'COD'
          ? `Pay ${inr(order.total)} in cash when it arrives`
          : 'We will confirm by email as soon as the payment clears.'}
      </p>
      {order.items.map((i) => (
        <div className="sum" key={i.product}><span>{i.name} x {i.qty}</span><span>{inr(i.price * i.qty)}</span></div>
      ))}
      <div className="sum"><span>Delivery</span><span>{order.shipping ? inr(order.shipping) : 'Free'}</span></div>
      <div className="sum total"><span>Total</span><span>{inr(order.total)}</span></div>
      <p className="muted">Delivering to {order.customer.name}, {order.customer.address}, {order.customer.city} {order.customer.pincode}.</p>
      <Link className="btn" to="/">Keep shopping</Link>
    </div>
  );
}
