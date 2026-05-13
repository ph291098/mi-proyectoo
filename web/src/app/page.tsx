import { AccessForm } from "@/components/waitlist-form";

export default function Page() {
  return (
    <main className="flex flex-1 flex-col">
      <Nav />
      <Hero />
      <Stats />
      <Categories />
      <Features />
      <Process />
      <Pricing />
      <Testimonials />
      <Cta />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5 text-sm font-medium">
          <span aria-hidden className="grid h-6 w-6 place-items-center">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0" stopColor="#5eead4" />
                  <stop offset="0.5" stopColor="#a78bfa" />
                  <stop offset="1" stopColor="#f472b6" />
                </linearGradient>
              </defs>
              <path
                d="M4 19 L12 4 L20 19 Z M8 19 L16 19"
                stroke="url(#lg)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="tracking-wide">ATLAS</span>
          <span className="ml-2 hidden rounded-full border border-line bg-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted sm:inline">
            B2B · v2026.5
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#catalog" className="hover:text-foreground">
            Catalog
          </a>
          <a href="#platform" className="hover:text-foreground">
            Platform
          </a>
          <a href="#pricing" className="hover:text-foreground">
            Pricing
          </a>
          <a href="#partners" className="hover:text-foreground">
            Partners
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#login"
            className="hidden rounded-full px-3.5 py-1.5 text-xs font-medium text-muted hover:text-foreground sm:inline-block"
          >
            Buyer log in
          </a>
          <a
            href="#apply"
            className="group relative inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background"
          >
            Apply
            <span aria-hidden className="transition group-hover:translate-x-0.5">
              →
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="aurora relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rise inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-muted">
            <span className="glow-dot" />
            Now onboarding retailers in 38 markets
          </div>
          <h1 className="rise rise-d1 mt-7 text-balance text-[44px] font-medium leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
            Wholesale,
            <br />
            <span className="gradient-text font-serif italic">in motion.</span>
          </h1>
          <p className="rise rise-d2 mx-auto mt-6 max-w-xl text-balance text-base text-muted sm:text-lg">
            ATLAS moves your goods, paperwork, and payments at the speed of your
            retail buyers — one dashboard from PO to delivery, with bulk pricing
            that updates in real time.
          </p>
          <div className="rise rise-d3 mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="#apply"
              className="group inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
            >
              Open a wholesale account
              <span aria-hidden className="transition group-hover:translate-x-0.5">
                →
              </span>
            </a>
            <a
              href="#catalog"
              className="glass inline-flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-medium text-foreground"
            >
              Browse the catalog
            </a>
          </div>
          <p className="rise rise-d4 mt-4 font-mono text-[11px] uppercase tracking-wider text-subtle">
            No credit card · Net-30 terms on approval · 24h response
          </p>
        </div>

        <div className="rise rise-d5 mt-20">
          <Dashboard />
        </div>
      </div>
    </section>
  );
}

function Dashboard() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="glass-strong overflow-hidden rounded-3xl p-2 shadow-[0_60px_140px_-40px_rgba(94,234,212,0.25),0_30px_80px_-20px_rgba(167,139,250,0.2)]">
        <div className="rounded-2xl border border-line bg-[#0a0a12]">
          {/* Window chrome */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-3/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent-2/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
            </div>
            <p className="font-mono text-[11px] text-subtle">
              atlas.co · /buyers/argos-supply-co
            </p>
            <p className="font-mono text-[11px] text-muted">
              <span className="scan">●</span> live
            </p>
          </div>

          {/* Body */}
          <div className="grid grid-cols-12 gap-0">
            <aside className="col-span-3 hidden border-r border-line p-5 text-xs sm:block">
              <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
                Buyer
              </p>
              <p className="mt-1.5 text-sm font-medium text-foreground">
                Argos Supply Co.
              </p>
              <p className="text-xs text-muted">Tier — Growth · Lisbon, PT</p>
              <div className="mt-6 space-y-2 text-muted">
                {[
                  ["Orders", "12"],
                  ["In transit", "4"],
                  ["MTD volume", "€84,200"],
                  ["Credit used", "62%"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span>{k}</span>
                    <span className="font-mono text-foreground">{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 font-mono text-[10px] uppercase tracking-wider text-subtle">
                Shortcuts
              </p>
              <ul className="mt-2 space-y-1.5 text-muted">
                <li className="hover:text-foreground">› New PO</li>
                <li className="hover:text-foreground">› Reorder favorites</li>
                <li className="hover:text-foreground">› Statements</li>
                <li className="hover:text-foreground">› Returns</li>
              </ul>
            </aside>

            <div className="col-span-12 p-6 sm:col-span-9 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
                    Live pricing · SKU MR-2840
                  </p>
                  <h3 className="mt-1 text-xl font-medium tracking-tight sm:text-2xl">
                    Linen Chore Coat — Bone
                  </h3>
                </div>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
                  in stock · 1,240 units
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { qty: "1–24", price: "€84.00", note: "MSRP" },
                  { qty: "25–99", price: "€61.20", note: "−27%" },
                  { qty: "100+", price: "€48.00", note: "−43%", live: true },
                ].map((t) => (
                  <div
                    key={t.qty}
                    className={`rounded-xl border p-4 ${
                      t.live
                        ? "border-accent/40 bg-accent/5"
                        : "border-line bg-white/[0.02]"
                    }`}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
                      {t.qty} units
                    </p>
                    <p className="mt-1 text-lg font-medium tracking-tight">
                      {t.price}
                    </p>
                    <p
                      className={`mt-0.5 font-mono text-[10px] ${
                        t.live ? "text-accent" : "text-muted"
                      }`}
                    >
                      {t.note}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-line bg-white/[0.02] p-4">
                <div className="flex items-center justify-between text-xs">
                  <p className="font-mono uppercase tracking-wider text-subtle">
                    Order timeline · PO-09241
                  </p>
                  <p className="text-muted">ETA Fri, 14:00 CET</p>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { label: "PO sent", done: true },
                    { label: "Confirmed", done: true },
                    { label: "Picking", done: true },
                    { label: "In transit", done: false, active: true },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="relative h-1 overflow-hidden rounded-full bg-line">
                        <div
                          className={`absolute inset-y-0 left-0 ${
                            s.done
                              ? "w-full bg-accent"
                              : s.active
                              ? "w-2/3 bg-gradient-to-r from-accent to-accent-2"
                              : "w-0"
                          }`}
                        />
                      </div>
                      <p
                        className={`mt-2 text-xs ${
                          s.done || s.active ? "text-foreground" : "text-subtle"
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stats() {
  const stats = [
    { k: "Pallets shipped / yr", v: "2.4M" },
    { k: "Retailers served", v: "11,300" },
    { k: "Markets covered", v: "38" },
    { k: "Avg. PO → ship time", v: "18h" },
  ];
  return (
    <section className="border-y border-line/80">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-line lg:grid-cols-4 lg:divide-x">
        {stats.map((s) => (
          <div key={s.k} className="px-6 py-8 sm:py-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">
              {s.k}
            </p>
            <p className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
              {s.v}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Categories() {
  const cats = [
    { name: "Apparel & textiles", count: "12,400 SKUs", hint: "Linen, knitwear, denim" },
    { name: "Home & living", count: "6,800 SKUs", hint: "Glassware, lighting, paper" },
    { name: "Specialty food", count: "3,200 SKUs", hint: "Coffee, olive oil, conserves" },
    { name: "Beauty & care", count: "2,150 SKUs", hint: "Skincare, fragrance, tools" },
    { name: "Stationery", count: "1,900 SKUs", hint: "Notebooks, pens, leather" },
    { name: "Outdoor & travel", count: "1,540 SKUs", hint: "Bags, bottles, gear" },
  ];
  return (
    <section id="catalog" className="relative py-28 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              The catalog
            </p>
            <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight sm:text-5xl">
              28,000 SKUs.{" "}
              <span className="gradient-text font-serif italic">One</span>{" "}
              dashboard.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted">
            We carry inventory across six categories, all priced in tiers, all
            backed by Net-30 terms.{" "}
            <a href="#" className="text-accent hover:underline">
              Open the full PDF →
            </a>
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <li key={c.name}>
              <a
                href="#"
                className="glass neon-ring group flex h-full flex-col justify-between rounded-2xl p-6 sm:p-7"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
                    {c.count}
                  </p>
                  <h3 className="mt-3 text-xl font-medium tracking-tight sm:text-2xl">
                    {c.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{c.hint}</p>
                </div>
                <p className="mt-10 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-accent">
                  Browse
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      title: "Bulk pricing that updates live",
      body:
        "Tier breaks recalculate the moment your cart crosses a threshold. No quote emails, no waiting room.",
    },
    {
      title: "Net-30 on approval",
      body:
        "Soft credit check, decision in 24 hours, terms scale as your volume grows.",
    },
    {
      title: "Logistics, built in",
      body:
        "Pick from FCL, LCL, or pallet courier at checkout. Live tracking and customs handed off automatically.",
    },
    {
      title: "Reorder in one click",
      body:
        "Every PO becomes a template. Your bestsellers reorder themselves on the cadence you set.",
    },
    {
      title: "API & EDI ready",
      body:
        "Sync to Shopify, NetSuite, SAP B1, or roll your own with our typed REST + EDI 850/810 endpoints.",
    },
    {
      title: "Returns without the email chain",
      body:
        "Damaged or short? Snap a photo in the buyer portal. Credit memo lands in your statement the same day.",
    },
  ];
  return (
    <section id="platform" className="relative border-y border-line/80 py-28 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-2">
            The platform
          </p>
          <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight sm:text-5xl">
            Built for buyers, not{" "}
            <span className="font-serif italic">inboxes</span>.
          </h2>
          <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
            Six things wholesale software keeps getting wrong — done right, end
            to end, in one product.
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-line bg-line/60 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <li
              key={it.title}
              className="group relative bg-background p-7 transition-colors hover:bg-white/[0.02] sm:p-8"
            >
              <div className="flex items-center gap-3 text-subtle">
                <span className="font-mono text-xs">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="h-px flex-1 bg-line" />
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-line transition-colors group-hover:bg-accent"
                />
              </div>
              <h3 className="mt-6 text-lg font-medium tracking-tight">
                {it.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {it.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    {
      k: "01",
      title: "Apply for an account",
      body:
        "Tell us about your shop or chain. Most retailers are approved within 24 hours.",
    },
    {
      k: "02",
      title: "Browse with live pricing",
      body:
        "Your tier and terms are baked into every page. No haggling, no PDF price sheets.",
    },
    {
      k: "03",
      title: "Place POs in seconds",
      body:
        "Build POs by SKU, by line sheet, or by ingesting your last order from Shopify.",
    },
    {
      k: "04",
      title: "Track everything, end to end",
      body:
        "From pick to dock to door — and a clean statement in your inbox on the first.",
    },
  ];
  return (
    <section className="relative py-28 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-3">
              The process
            </p>
            <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight sm:text-5xl">
              From apply to{" "}
              <span className="gradient-text font-serif italic">delivered</span>
              .
            </h2>
            <p className="mt-4 max-w-md text-base text-muted sm:text-lg">
              Four steps. None of them include “waiting for a sales rep to get
              back to you.”
            </p>
          </div>
          <ol className="space-y-4 lg:col-span-7">
            {steps.map((s) => (
              <li
                key={s.k}
                className="glass neon-ring rounded-2xl p-6 sm:p-7"
              >
                <div className="flex items-start gap-5">
                  <span
                    aria-hidden
                    className="glass-strong grid h-12 w-12 shrink-0 place-items-center rounded-xl font-mono text-sm text-foreground"
                  >
                    {s.k}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium tracking-tight sm:text-xl">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                      {s.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Starter",
      cap: "Up to €25k / quarter",
      price: "0%",
      priceNote: "platform fee",
      features: [
        "Live pricing on 28k SKUs",
        "Net-15 on approval",
        "Standard courier rates",
        "Email support",
      ],
      cta: "Open an account",
      accent: false,
    },
    {
      name: "Growth",
      cap: "€25k – €250k / quarter",
      price: "0%",
      priceNote: "platform fee · Net-30",
      features: [
        "Everything in Starter",
        "Net-30 terms (soft credit check)",
        "Pallet courier + LCL",
        "Dedicated buyer success rep",
        "Reorder templates + API access",
      ],
      cta: "Apply for Growth",
      accent: true,
    },
    {
      name: "Enterprise",
      cap: "€250k+ / quarter",
      price: "Custom",
      priceNote: "EDI, FCL, custom terms",
      features: [
        "Everything in Growth",
        "FCL with named consolidator",
        "EDI 850/810/856",
        "Net-60 on approval",
        "Quarterly business review",
      ],
      cta: "Talk to sales",
      accent: false,
    },
  ];
  return (
    <section id="pricing" className="relative border-y border-line/80 py-28 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
            Pricing
          </p>
          <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight sm:text-5xl">
            We make money on{" "}
            <span className="font-serif italic">margin</span>, not fees.
          </h2>
          <p className="mt-4 text-base text-muted sm:text-lg">
            Buyer accounts are free. Choose the tier that matches your quarterly
            volume — upgrade automatically when you cross a threshold.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-3xl p-7 sm:p-8 ${
                t.accent ? "glass-strong neon-ring" : "glass"
              }`}
            >
              {t.accent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-background">
                  Most retailers
                </span>
              )}
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                {t.name}
              </p>
              <p className="mt-1 text-sm text-subtle">{t.cap}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span
                  className={`text-5xl font-medium tracking-tight ${
                    t.accent ? "gradient-text" : ""
                  }`}
                >
                  {t.price}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">{t.priceNote}</p>
              <ul className="mt-7 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-foreground/85">
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#apply"
                className={`mt-8 flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-medium transition ${
                  t.accent
                    ? "bg-foreground text-background hover:opacity-90"
                    : "glass text-foreground hover:bg-white/[0.06]"
                }`}
              >
                {t.cta} →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      body:
        "We replaced four spreadsheets, two reps, and a fax line with ATLAS. Reorder time dropped from a week to a Tuesday afternoon.",
      who: "Mara Köhler",
      role: "Buyer · Halcyon, Berlin",
    },
    {
      body:
        "Net-30 on the same day we applied. The Growth tier paid for itself the first quarter just on courier savings.",
      who: "Iván Soto",
      role: "Founder · Verre, Madrid",
    },
    {
      body:
        "The live pricing alone changed how we plan a season. We finally see the tier breaks before we order, not after.",
      who: "Yuki Tan",
      role: "Head of Buying · Marginalia, Singapore",
    },
  ];
  return (
    <section id="partners" className="relative py-28 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-2">
          From the buyers
        </p>
        <h2 className="mt-3 max-w-2xl text-balance text-3xl font-medium tracking-tight sm:text-5xl">
          The shops who run on{" "}
          <span className="gradient-text font-serif italic">ATLAS</span>.
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {quotes.map((q) => (
            <figure
              key={q.who}
              className="glass rounded-2xl p-7 sm:p-8"
            >
              <svg
                aria-hidden
                viewBox="0 0 32 32"
                className="h-8 w-8 fill-accent/70"
              >
                <path d="M0 24V14C0 8 4 4 10 4v6c-2.4 0-4 1.6-4 4h4v10H0zm18 0V14c0-6 4-10 10-10v6c-2.4 0-4 1.6-4 4h4v10H18z" />
              </svg>
              <blockquote className="mt-5 font-serif text-xl leading-snug tracking-tight text-foreground/95">
                “{q.body}”
              </blockquote>
              <figcaption className="mt-6 border-t border-line pt-4 text-sm">
                <p className="font-medium text-foreground">{q.who}</p>
                <p className="text-muted">{q.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-14 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="marquee-track flex w-max gap-14 whitespace-nowrap font-serif text-2xl text-muted">
            {[
              "Halcyon",
              "Verre",
              "Marginalia",
              "Studio Olm",
              "FieldNotes",
              "Northbound",
              "Quill & Co.",
              "Atrium",
              "Halcyon",
              "Verre",
              "Marginalia",
              "Studio Olm",
              "FieldNotes",
              "Northbound",
              "Quill & Co.",
              "Atrium",
            ].map((l, i) => (
              <span key={i} className="opacity-70">
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section id="apply" className="aurora relative border-y border-line/80 py-28 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          Open a wholesale account
        </p>
        <h2 className="mt-3 text-balance text-4xl font-medium tracking-tight sm:text-6xl">
          Move your buyers{" "}
          <span className="gradient-text font-serif italic">forward</span>.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          24-hour decision · Net-30 on approval · No platform fees for buyers.
          Tell us about your shop and a specialist will be in touch.
        </p>
        <div className="mt-10">
          <AccessForm />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <a href="#" className="flex items-center gap-2.5 text-sm font-medium">
            <span aria-hidden className="grid h-6 w-6 place-items-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path
                  d="M4 19 L12 4 L20 19 Z M8 19 L16 19"
                  stroke="#5eead4"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="tracking-wide">ATLAS</span>
          </a>
          <p className="mt-3 max-w-sm text-xs text-muted">
            ATLAS is the wholesale platform for independent retailers and the
            brands they buy from. Operated from Lisbon, shipping from 14 hubs.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-8 text-xs sm:gap-12">
          {[
            ["Product", ["Catalog", "Pricing", "API"]],
            ["Company", ["About", "Careers", "Press"]],
            ["Legal", ["Terms", "Privacy", "DPA"]],
          ].map(([h, ls]) => (
            <div key={h as string}>
              <p className="font-mono uppercase tracking-wider text-subtle">
                {h as string}
              </p>
              <ul className="mt-3 space-y-2 text-muted">
                {(ls as string[]).map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-foreground">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-line px-6 pt-6 font-mono text-[11px] text-subtle">
        © 2026 ATLAS Supply Co. · Lisbon, PT · partners@atlas.co
      </div>
    </footer>
  );
}
