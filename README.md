## Noire Haven (Airbnb-Inspired MVP)

Next.js + Node.js + PostgreSQL + Prisma starter for a vacation rental platform.

### Implemented

- Airbnb-inspired homepage UI style (brand colors, search bar, category chips, listing cards)
- API route stubs:
  - `GET /api/listings`
  - `POST /api/bookings`
- Prisma data model for users, listings, bookings, and reviews

### Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Ensure PostgreSQL is running and update `DATABASE_URL` in `.env`.

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Run migrations:

```bash
npm run prisma:migrate
```

6. Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Next Steps

- Add authentication (Clerk/Auth.js)
- Create host dashboard CRUD
- Connect map search and availability calendar
- Integrate Stripe checkout

### Stripe Setup (Step 4)

Add these values to `.env`:

```bash
JWT_SECRET="change-this-to-a-long-random-secret"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Flow:

- `POST /api/payments/checkout` creates pending booking + Stripe Checkout session
- User completes payment on Stripe
- Redirect to `/book/success`, which calls `POST /api/payments/confirm`
- Booking status becomes `CONFIRMED` when Stripe session is paid
