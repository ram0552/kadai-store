import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { useCart } from './context/CartContext.jsx';
import Shop from './pages/Shop.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';

export default function App() {
  const { count } = useCart();
  return (
    <>
      <header className="bar">
        <Link to="/" className="brand">Kadai &amp; Co.</Link>
        <nav>
          <NavLink to="/">Shop</NavLink>
          <NavLink to="/cart">Cart{count > 0 && <span className="badge">{count}</span>}</NavLink>
        </nav>
      </header>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderSuccess />} />
          <Route path="*" element={<p className="note">Page not found. <Link to="/">Back to the shop</Link></p>} />
        </Routes>
      </main>
    </>
  );
}
