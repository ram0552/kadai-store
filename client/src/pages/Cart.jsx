import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { FREE_SHIPPING_ABOVE, inr } from '../utils/pricing.js';

export default function Cart() {
  const { items, setQty, remove, subtotal, shipping, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="empty">
        <h2>Your cart is empty</h2>
        <Link className="btn" to="/">Browse the shop</Link>
      </div>
    );
  }

  return (
    <div className="two-col">
      <section>
        <h2>Your cart</h2>
        {items.map(({ product, qty }) => (
          <div className="line" key={product._id}>
            <div className="swatch" style={{ background: product.tone }} />
            <div className="grow">
              <strong>{product.name}</strong>
              <div className="muted">{product.weight} &middot; {inr(product.price)} each</div>
              <button className="link" onClick={() => remove(product._id)}>Remove</button>
            </div>
            <div className="qty">
              <button aria-label="Decrease quantity" onClick={() => setQty(product._id, qty - 1)}>-</button>
              <span>{qty}</span>
              <button aria-label="Increase quantity" onClick={() => setQty(product._id, qty + 1)}>+</button>
            </div>
            <strong className="amt">{inr(product.price * qty)}</strong>
          </div>
        ))}
      </section>

      <aside className="summary">
        <h3>Order summary</h3>
        <div className="sum"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
        <div className="sum"><span>Delivery</span><span>{shipping ? inr(shipping) : 'Free'}</span></div>
        {shipping > 0 && <p className="muted">Add {inr(FREE_SHIPPING_ABOVE - subtotal)} more for free delivery.</p>}
        <div className="sum total"><span>Total</span><span>{inr(total)}</span></div>
        <Link className="btn block" to="/checkout">Go to checkout</Link>
      </aside>
    </div>
  );
}
