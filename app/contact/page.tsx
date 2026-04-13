import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact us — Noire Haven",
  description:
    "Reach Noire Haven for general questions, guest or host support, privacy, and partnerships.",
};

type ContactRow = {
  title: string;
  description: string;
  email: string;
};

/** All public inboxes from product email matrix (Mail da creare e collegare). */
const CONTACT_ROWS: ContactRow[] = [
  {
    title: "General information",
    description:
      "Pre‑sales questions, press, affiliates, and anything that doesn’t fit another category.",
    email: "info@noirehaven.com",
  },
  {
    title: "Guest support",
    description:
      "Help with trips, bookings, payments, account access, and cancellations from a guest perspective.",
    email: "supporto@noirehaven.com",
  },
  {
    title: "Host support",
    description:
      "Listings, payouts, Stripe Connect, fees, and disputes for hosts.",
    email: "venditori@noirehaven.com",
  },
  {
    title: "Welcome & onboarding",
    description:
      "Welcome emails, account setup, tutorials, profile completion, and first‑booking prompts.",
    email: "onboarding@noirehaven.com",
  },
  {
    title: "Bookings & receipts",
    description:
      "Order confirmations, invoices, and stay‑related transactional messages.",
    email: "ordini@noirehaven.com",
  },
  {
    title: "Billing & invoicing",
    description:
      "Invoices for hosts, reconciliations, fiscal communications, and backup receipts for guests.",
    email: "fatturazione@noirehaven.com",
  },
  {
    title: "Logistics & shipping",
    description:
      "Carrier updates, tracking, delivery issues, and pickup notices when shipping applies.",
    email: "delivery@noirehaven.com",
  },
  {
    title: "Returns & refunds",
    description:
      "Return authorization, refund status, labels, and related timelines.",
    email: "resi@noirehaven.com",
  },
  {
    title: "Reviews",
    description:
      "Post‑stay or post‑purchase requests to rate stays, hosts, or listings.",
    email: "recensioni@noirehaven.com",
  },
  {
    title: "Abandoned cart",
    description:
      "Recovery sequences for unfinished bookings or checkouts (timed reminders).",
    email: "abbandonato@noirehaven.com",
  },
  {
    title: "Marketing & promotions",
    description:
      "Offers, new arrivals, personalized discounts, seasonal campaigns, and flash sales.",
    email: "marketing@noirehaven.com",
  },
  {
    title: "Newsletter",
    description:
      "Dedicated sender for newsletter campaigns and subscription‑related mail.",
    email: "newsletter@noirehaven.com",
  },
  {
    title: "Partnerships",
    description:
      "Brand collaborations, integrations, external marketplace partnerships, and API discussions.",
    email: "partner@noirehaven.com",
  },
  {
    title: "Privacy & GDPR",
    description:
      "Data access, correction, deletion, restriction, breach reports, and privacy requests.",
    email: "privacy@noirehaven.com",
  },
  {
    title: "Security",
    description:
      "2FA notices, password changes, new‑device logins, and security‑sensitive account alerts.",
    email: "sicurezza@noirehaven.com",
  },
  {
    title: "Abuse reports",
    description:
      "Spam, policy violations, fraudulent listings or hosts, and counterfeit or unsafe content.",
    email: "abuse@noirehaven.com",
  },
  {
    title: "Feedback",
    description:
      "Suggestions, NPS surveys, testimonials, and bug reports about the platform.",
    email: "feedback@noirehaven.com",
  },
  {
    title: "Social & creators",
    description:
      "Contests, UGC, and coordination for Instagram, TikTok, Pinterest, Facebook, and influencers.",
    email: "social@noirehaven.com",
  },
  {
    title: "Automated notifications",
    description:
      "System mail such as password resets, login alerts, cart reminders, and email verification. This inbox is not monitored for replies.",
    email: "no-reply@noirehaven.com",
  },
  {
    title: "Deliverability (bounce handling)",
    description:
      "Technical address used by mail systems for bounces and non‑delivery reports — not for guest or host support.",
    email: "bounce@noirehaven.com",
  },
];

export default function ContactPage() {
  return (
    <main>
      <section className="surface border-b border-[var(--border)]">
        <div className="container py-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Contact
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
              Contact us
            </h1>
            <p className="muted mx-auto mt-4 max-w-2xl text-base leading-relaxed">
              Choose the email address that best matches your question so we can route your message to
              the right team. We typically reply within one to two business days (except automated or
              technical senders noted below).
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
              >
                Back to home
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
              >
                Privacy policy
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-14">
        <div className="mx-auto max-w-4xl">
          <ul className="space-y-4">
            {CONTACT_ROWS.map((row) => (
              <li
                key={row.email}
                className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-neutral-900">{row.title}</h2>
                    <p className="muted mt-1 text-sm leading-relaxed">{row.description}</p>
                  </div>
                  <a
                    href={`mailto:${row.email}`}
                    className="shrink-0 rounded-xl bg-[var(--brand-soft)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--brand)] transition hover:opacity-90"
                  >
                    {row.email}
                  </a>
                </div>
              </li>
            ))}
          </ul>

          <p className="muted mt-10 text-center text-sm">
            Routine system mail may also use the automated and bounce addresses listed above. Do not
            expect replies from those inboxes.
          </p>
        </div>
      </section>
    </main>
  );
}
