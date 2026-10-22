import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { FREE_SHIPPING_ABOVE, inr } from '../utils/pricing.js';

export default function Shop() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const { add, items } = useCart();

  useEffect(() => {
    api.get('/products').then(setProducts).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Pantry staples from Andhra, made in small batches.</h1>
        <p>Chillies ground the week they are dried. Pickles aged in jars. Free delivery over {inr(FREE_SHIPPING_ABOVE)}.</p>
      </section>

      {error && <p className="alert">{error}</p>}
      {!products && !error && <p className="note">Loading products...</p>}
      {products && products.length === 0 && <p className="note">No products yet. Run <code>npm run seed</code> in the server folder.</p>}

      <div className="grid">
        {products?.map((p) => {
          const inCart = items.find((i) => i.product._id === p._id)?.qty || 0;
          const soldOut = p.stock < 1;
          return (
            <article key={p._id} className="card">
              <div className="packet" style={{ background: p.tone }} aria-hidden="true">
                <span>{p.weight}</span>
              </div>
              <div className="card-body">
                <h3>{p.name}</h3>
                <p className="muted">{p.description}</p>
                <div className="row">
                  <strong>{inr(p.price)}</strong>
                  <button className="btn small" disabled={soldOut || inCart >= p.stock} onClick={() => add(p)}>
                    {soldOut ? 'Sold out' : inCart ? `Add another (${inCart})` : 'Add to cart'}
                  </button>
                </div>
                {!soldOut && p.stock <= 10 && <p className="low">Only {p.stock} left</p>}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
