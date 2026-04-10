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

export default function PrivacyPage() {
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
                  Privacy &amp; Cookie Policy
                </h1>
                <p className="muted mt-4 max-w-2xl text-base leading-relaxed">
                  We explain what data we collect, why we collect it, and what choices you have.
                  We also explain how cookies are used to keep the platform working.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#policy"
                    className="brand-btn inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Read policy
                  </a>
                  <Link
                    href="/terms"
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                  >
                    Terms &amp; conditions
                  </Link>
                </div>
              </div>

              <aside className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-neutral-900">Quick summary</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="muted">We store account + booking data to run the service.</li>
                  <li className="muted">Payments are processed by Stripe.</li>
                  <li className="muted">Cookies help keep you signed in and improve usability.</li>
                </ul>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
              The policies that keep up with changing laws (finally)
            </h2>
            <p className="muted mt-3 text-sm">
              Plain-language privacy and cookie information for guests and hosts.
            </p>
            <AccentDivider />
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {[
              {
                title: "Smart setup",
                desc: "We collect only what we need to run the marketplace (accounts, bookings, and messages).",
                icon: (
                  <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2a7 7 0 0 0-4 13v3a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3a7 7 0 0 0-4-13Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path d="M10 21h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "For every use",
                desc: "Data is used for bookings, customer support, and security (fraud prevention).",
                icon: (
                  <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3 4 7v6c0 5 3 8 8 9 5-1 8-4 8-9V7l-8-4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Easy updates",
                desc: "This page is updated when our data practices change, so users always see the latest version.",
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
                title: "Make a good impression",
                desc: "We describe payments and cookies clearly so guests and hosts can trust the platform.",
                icon: (
                  <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.65-7 10-7 10Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
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

          <div id="policy" className="mt-16 rounded-2xl border border-[var(--border)] bg-white p-8">
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">Full policy</h2>
              <p className="muted mt-2 text-sm">
                Last updated: {new Date().toISOString().slice(0, 10)}
              </p>
              <AccentDivider />
            </div>

            <div className="prose prose-neutral mt-8 max-w-none">
              <h3>1. Data we collect</h3>
              <ul>
                <li>Account data (email, name, profile details)</li>
                <li>Booking data (dates, guests, listing details)</li>
                <li>Payment references (Stripe session / payment identifiers)</li>
                <li>Messages sent through the platform</li>
              </ul>

              <h3>2. Why we process data</h3>
              <ul>
                <li>To provide the marketplace and manage bookings</li>
                <li>To process payments and prevent fraud</li>
                <li>To support hosts with payouts via Stripe Connect</li>
                <li>To communicate service updates and confirmations</li>
              </ul>

              <h3>3. Payments</h3>
              <p>
                Payments are processed by Stripe. We store references needed to confirm payments and
                run payouts (for example, Stripe Checkout Session and Payment Intent IDs).
              </p>

              <h3>4. Cookies</h3>
              <p>
                We use cookies and similar technologies to keep you signed in, remember preferences,
                and improve the service.
              </p>

              <h3>5. Your choices</h3>
              <p>
                Depending on your location, you may have rights to access, correct, or delete your
                personal data. Contact support for requests.
              </p>

              <h3>6. Contact</h3>
              <p>
                For more information, contact support. Also review our{" "}
                <Link href="/terms">Terms &amp; Conditions</Link>.
              </p>
            </div>
          </div>

          <div className="mt-16 rounded-2xl border border-[var(--border)] bg-white p-8">
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">FAQ</h2>
              <AccentDivider />
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                {
                  q: "Do you store card numbers?",
                  a: "No. Card details are handled by Stripe. We store only payment identifiers and references.",
                },
                {
                  q: "How do cookies help?",
                  a: "Cookies keep you signed in, help prevent abuse, and improve the overall user experience.",
                },
                {
                  q: "Can I request deletion of my data?",
                  a: "Depending on your jurisdiction, you may request access, correction, or deletion by contacting support.",
                },
                {
                  q: "Who can see booking messages?",
                  a: "Only participants in the booking thread (guest, host, and admin) can see conversation messages.",
                },
              ].map((qa) => (
                <div key={qa.q} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <p className="text-sm font-semibold text-neutral-900">{qa.q}</p>
                  <p className="muted mt-2 text-sm leading-relaxed">{qa.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

