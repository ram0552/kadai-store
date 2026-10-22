# Kadai & Co. - MERN store with Razorpay + Cash on Delivery

MongoDB, Express, React (Vite) and Node. Checkout offers **Cash on delivery** and **Pay online (Razorpay Standard Checkout)**.

## Setup

Prerequisites: Node 18+, a running MongoDB, a Razorpay account (Test Mode keys).

```bash
# 1. Backend
cd server
npm install
cp .env.example .env        # then fill in the values
npm run seed                # loads 8 sample products
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
cp .env.example .env        # set VITE_RAZORPAY_KEY_ID to your rzp_test_ key id
npm run dev                 # http://localhost:5173
```

Never put `RAZORPAY_KEY_SECRET` in `client/.env`. Both `.env` files are git-ignored.

## Deploying to Render and Vercel

Deploy the backend and frontend as separate services. MongoDB Atlas and Razorpay
must be reachable from the deployed backend.

### 1. Deploy the API to Render

Create a **Web Service** from this repository with:

- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`

The included [`render.yaml`](./render.yaml) can also be used as a Blueprint.
Add these Render environment variables:

```text
MONGO_URI=<your MongoDB Atlas connection string>
CLIENT_URL=https://<your-vercel-project>.vercel.app
RAZORPAY_KEY_ID=<test-or-live-public-key>
RAZORPAY_KEY_SECRET=<test-or-live-secret>
RAZORPAY_WEBHOOK_SECRET=<Razorpay webhook secret>
```

Render supplies `PORT` automatically. Do not commit any `.env` file or secret.
In MongoDB Atlas, add the Render service's outbound access (or temporarily
allow `0.0.0.0/0` for development) and create the products once by running
`npm run seed` from the `server` directory with the production `MONGO_URI`.

### 2. Deploy the client to Vercel

Import the same repository as a Vercel project with:

- **Root Directory:** `client`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Add these Vercel environment variables before deploying:

```text
VITE_API_URL=https://<your-render-service>.onrender.com/api
VITE_RAZORPAY_KEY_ID=<the matching Razorpay public key>
```

The included [`client/vercel.json`](./client/vercel.json) keeps React Router
routes working after a browser refresh. After the Vercel URL is known, update
Render's `CLIENT_URL` to that exact URL (without a trailing slash) and redeploy
the API. Configure the Razorpay webhook URL as:

```text
https://<your-render-service>.onrender.com/api/payment/webhook
```

Use test keys and a test webhook while validating checkout. Switch both
Razorpay keys and the webhook configuration together when going live.

## How the payment flow works

1. Customer picks **Pay online** and clicks Pay.
2. `POST /api/payment/create-order`: the server rebuilds the cart from MongoDB (prices are never taken from the browser),
   saves an order as `awaiting_payment`, creates a Razorpay order (amount in paise) and returns `order_id`.
3. The browser opens the Razorpay modal with that `order_id`.
4. On success the browser sends `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` to
   `POST /api/payment/verify-payment`. The server checks `HMAC_SHA256(order_id|payment_id, KEY_SECRET)` with a
   constant-time compare. Only a match marks the order `paid` and reduces stock. A mismatch returns 400.
5. `POST /api/payment/webhook` is a safety net (user closes the tab after paying). It verifies the
   `x-razorpay-signature` header against the raw body and marks the order paid. Both paths are idempotent.

COD uses `POST /api/orders/cod`: order is `placed`, payment `pending` until delivery.

## Test it

**COD:** add items, checkout, choose Cash on delivery, Place order. Check the `orders` collection.

**Razorpay (Test Mode):** choose Pay online. Use card `4111 1111 1111 1111`, any future expiry, any CVV, OTP `1234`
(or UPI `success@razorpay`). Full list: https://razorpay.com/docs/payments/payments/test-card-details/
- Success: order shows "Payment received", `paymentStatus: paid` in MongoDB, stock reduced, cart cleared.
- Close the modal: "Payment cancelled", cart kept.
- Use UPI `failure@razorpay`: failure message shown, you can retry in the modal.
- Tamper test: POST a wrong signature to `/api/payment/verify-payment` and you get 400 and the order stays unpaid.

## Webhook (manual step)

1. Expose the API: `ngrok http 5000`.
2. Dashboard -> Settings -> Webhooks -> Add: URL `https://<ngrok-id>.ngrok.io/api/payment/webhook`,
   events `payment.captured`, `payment.failed`, `order.paid`, and a secret of your choice.
3. Put the same secret in `server/.env` as `RAZORPAY_WEBHOOK_SECRET` and restart the server.

## Going live

Complete KYC, generate Live keys, swap them into `.env`, and set `CLIENT_URL` to your real domain.

## Notes

- Guest checkout (no login) keeps the demo small. For real use, add auth and tie orders to users.
- Shipping rule (free over Rs 999, else Rs 49) lives in `server/services/order.service.js`; the client copy in
  `client/src/utils/pricing.js` is display-only.
"# kadai-store" 
"# kadai-store" 
