import Link from "next/link";

function AccentDivider() {
  return (
    <div className="mt-5 flex justify-center" aria-hidden>
      <div className="h-1 w-16 rounded-full bg-[var(--brand)]/80" />
    </div>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
      {children}
    </div>
  );
}

export default function TermsPage() {
  return (
    <main>
      <section className="surface border-b border-[var(--border)]">
        <div className="container py-14">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-start gap-10 lg:grid-cols-[1.35fr_0.65fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Legal
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
                  Terms &amp; Conditions
                </h1>
                <p className="muted mt-4 max-w-2xl text-base leading-relaxed">
                  Clear rules for guests and hosts. These terms explain how bookings, payments, and
                  payouts work on Noire Haven.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#terms"
                    className="brand-btn inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Read terms
                  </a>
                  <Link
                    href="/privacy"
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                  >
                    Privacy policy
                  </Link>
                </div>
              </div>

              <aside className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-neutral-900">
                  At a glance
                </p>
                <dl className="mt-3 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="muted">Guest payments</dt>
                    <dd className="font-semibold text-neutral-900">Stripe Checkout</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="muted">Host payouts</dt>
                    <dd className="font-semibold text-neutral-900">Stripe Connect</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="muted">Updates</dt>
                    <dd className="font-semibold text-neutral-900">Posted here</dd>
                  </div>
                </dl>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
              Online in three steps, without being a lawyer or programmer
            </h2>
            <p className="muted mt-3 text-sm">
              Simple rules for bookings, payments, and payouts — written in plain language.
            </p>
            <AccentDivider />
          </div>

          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              {
                n: 1,
                title: "Create",
                desc: "Hosts publish listings. Guests request bookings and message hosts.",
                bullets: ["Listing details and pricing", "Availability and rules", "Messaging for support"],
                icon: (
                  <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8 7h8M8 11h8M8 15h5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                ),
              },
              {
                n: 2,
                title: "Pay",
                desc: "Guests pay the platform securely using Stripe Checkout.",
                bullets: ["Multiple payment methods", "Receipt link on confirmation", "Retry checkout if unfinished"],
                icon: (
                  <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 7h18v10H3V7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 10h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M7 14h4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
              {
                n: 3,
                title: "Keep up",
                desc: "After completion, payouts are processed to hosts via Stripe Connect.",
                bullets: ["Payout eligibility after stay", "Transfers tracked in admin", "Hosts connect payouts anytime"],
                icon: (
                  <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 6v6l4 2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 12a9 9 0 1 1-9-9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex w-fit items-center justify-center">
                  <IconBox>{s.icon}</IconBox>
                  <span className="-ml-3 grid h-8 w-8 place-items-center rounded-full border border-[var(--brand-soft-border)] bg-white text-sm font-bold text-[var(--brand)]">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-neutral-900">{s.title}</h3>
                <p className="muted mx-auto mt-2 max-w-xs text-sm leading-relaxed">{s.desc}</p>
                <ul className="muted mx-auto mt-4 max-w-xs list-disc space-y-1 pl-5 text-left text-sm">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
              What&apos;s included
            </h2>
            <p className="muted mt-3 text-sm">
              Everything you need for a clear marketplace flow: booking rules, payments, and payout tracking.
            </p>
            <AccentDivider />
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {[
              {
                title: "Clear booking rules",
                desc: "Requests, acceptance, cancellations, and support through the booking thread.",
                icon: (
                  <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path d="M8 12l2 2 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                ),
              },
              {
                title: "Always up to date",
                desc: "The latest version is posted here, so hosts and guests can always review changes.",
                icon: (
                  <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 12a9 9 0 1 1-2.64-6.36"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M21 3v6h-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
              {
                title: "Built for international users",
                desc: "Hosts and guests can use the platform from anywhere; policies are written in plain language.",
                icon: (
                  <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                ),
              },
              {
                title: "Suitable for any business",
                desc: "Whether you’re launching an app, marketplace, or SaaS, these terms cover the essentials.",
                icon: (
                  <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 21V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path d="M9 21V9h6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <IconBox>{f.icon}</IconBox>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{f.title}</p>
                  <p className="muted mt-1 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
              Suitable for any business
            </h2>
            <p className="muted mt-3 text-sm">
              Blog, e-commerce, app, or SaaS — the structure stays consistent and easy to understand.
            </p>
            <AccentDivider />
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Websites and blogs",
                desc: "Cover intellectual property, moderation, and platform rules.",
                icon: (
                  <svg aria-hidden className="h-10 w-10" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 5h16v11H4V5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path d="M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "E-commerce",
                desc: "Include cancellations, refunds, and payment confirmations.",
                icon: (
                  <svg aria-hidden className="h-10 w-10" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 7h15l-1.5 9h-12L6 7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path d="M6 7 5 4H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
                    <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
                  </svg>
                ),
              },
              {
                title: "App (web and mobile)",
                desc: "User accounts, acceptable use, and communication rules.",
                icon: (
                  <svg aria-hidden className="h-10 w-10" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path d="M11 19h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "SaaS",
                desc: "Usage limits, uptime expectations, and account lifecycle terms.",
                icon: (
                  <svg aria-hidden className="h-10 w-10" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 7a4 4 0 0 1 4-4h8a4 4 0 1 1 0 8H9a3 3 0 0 0 0 6h9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 17l2 2-2 2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-sm"
              >
                <div className="mx-auto grid w-fit place-items-center text-[var(--brand)]">
                  {c.icon}
                </div>
                <p className="mt-4 text-sm font-semibold text-neutral-900">{c.title}</p>
                <p className="muted mt-2 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          <div
            id="terms"
            className="mt-16 rounded-2xl border border-[var(--border)] bg-white p-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">
                Full terms
              </h2>
              <p className="muted mt-2 text-sm">
                Last updated: {new Date().toISOString().slice(0, 10)}
              </p>
              <AccentDivider />
            </div>

            <div className="prose prose-neutral mt-8 max-w-none">
              <h3>1. About the service</h3>
              <p>
                Noire Haven is a marketplace that connects guests with hosts offering short-term
                stays. We facilitate bookings and payments on the platform.
              </p>

              <h3>2. Accounts</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account and for all
                activity that occurs under it.
              </p>

              <h3>3. Bookings and payments</h3>
              <p>
                Guests pay the platform via Stripe Checkout. Payment confirmation is provided after
                Stripe verifies the transaction.
              </p>

              <h3>4. Cancellations and refunds</h3>
              <p>
                Cancellation rules and any refunds depend on the booking status and platform
                policies. If you need support, contact us via your booking thread.
              </p>

              <h3>5. Host obligations</h3>
              <p>
                Hosts are responsible for listing accuracy, availability, and compliance with local
                laws. Hosts must connect Stripe to receive payouts.
              </p>

              <h3>6. Acceptable use</h3>
              <p>
                You agree not to misuse the platform, attempt unauthorized access, or violate
                applicable law.
              </p>

              <h3>7. Limitation of liability</h3>
              <p>
                To the maximum extent permitted by law, Noire Haven is not liable for indirect,
                incidental, or consequential damages arising from your use of the platform.
              </p>

              <h3>8. Changes</h3>
              <p>
                We may update these terms from time to time. The latest version will be posted on
                this page.
              </p>

              <h3>9. Contact</h3>
              <p>
                For questions, contact support. You can also review our{" "}
                <Link href="/privacy">Privacy &amp; Cookie Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

