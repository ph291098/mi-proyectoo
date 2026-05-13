import { WaitlistForm } from "@/components/waitlist-form";

export default function Page() {
  return (
    <main className="flex flex-1 flex-col">
      <Nav />
      <Hero />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <Quote />
      <Faq />
      <Cta />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2 text-sm font-medium">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-foreground"
          />
          <span>Lumen</span>
          <span className="ml-2 hidden rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted sm:inline">
            Private beta
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#how" className="hover:text-foreground">
            How it works
          </a>
          <a href="#faq" className="hover:text-foreground">
            FAQ
          </a>
        </nav>
        <a
          href="#waitlist"
          className="rounded-full border border-foreground/90 bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:-translate-y-px"
        >
          Get invite
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="grain spotlight relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rise inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-muted shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Launching in spring 2026 · Invite-only
          </div>

          <h1 className="rise rise-delay-1 mt-8 text-balance text-[44px] font-medium leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Quiet software for{" "}
            <span className="font-serif italic">focused</span> work.
          </h1>

          <p className="rise rise-delay-2 mx-auto mt-6 max-w-xl text-balance text-base text-muted sm:text-lg">
            Lumen is a calm, opinionated workspace for makers — no notifications,
            no busywork, no infinite menus. Just one clear thing at a time.
          </p>

          <div
            id="waitlist"
            className="rise rise-delay-3 mt-10 flex flex-col items-center gap-3"
          >
            <WaitlistForm />
            <p className="text-xs text-subtle">
              No spam. One short email per release.
            </p>
          </div>
        </div>

        <div className="rise rise-delay-4 mt-20 sm:mt-24">
          <MockUI />
        </div>
      </div>
    </section>
  );
}

function MockUI() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_30px_60px_-30px_rgba(10,10,10,0.25),0_0_0_1px_rgba(10,10,10,0.02)]">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="ml-3 text-xs text-subtle">lumen / today</span>
        </div>
        <div className="grid grid-cols-12 gap-0">
          <aside className="col-span-3 hidden border-r border-line p-5 text-xs text-muted sm:block">
            <p className="text-[11px] font-medium uppercase tracking-wider text-subtle">
              Today
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-2 text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Draft launch note
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-line" />
                Review pricing page
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-line" />
                Reply to Maya
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-line" />
                Walk · 20 min
              </li>
            </ul>
          </aside>
          <div className="col-span-12 p-8 sm:col-span-9 sm:p-10">
            <p className="text-[11px] font-medium uppercase tracking-wider text-subtle">
              Now
            </p>
            <h3 className="mt-2 text-xl font-medium tracking-tight sm:text-2xl">
              Draft launch note
            </h3>
            <div className="mt-5 space-y-2 font-serif text-lg leading-relaxed text-foreground/85">
              <p>
                We built Lumen because we missed the feeling of <em>one thing</em>{" "}
                at a time. The internet keeps adding tabs.
              </p>
              <p className="text-foreground/40">
                Lumen takes them all away — and gives you back the hour you came
                here for.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3 text-xs text-muted">
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">
                Deep work
              </span>
              <span>·</span>
              <span>42 min remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoStrip() {
  const logos = [
    "FieldNotes",
    "Atrium",
    "Northbound",
    "Quill & Co.",
    "Studio Olm",
    "Verre",
    "Halcyon",
    "Marginalia",
  ];
  const doubled = [...logos, ...logos];
  return (
    <section className="border-y border-line bg-card/50 py-10">
      <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-subtle">
        Trusted by a small, careful list of studios
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="marquee-track flex w-max gap-14 whitespace-nowrap px-6 font-serif text-2xl text-muted">
          {doubled.map((l, i) => (
            <span key={i} className="opacity-70">
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items: { title: string; body: string }[] = [
    {
      title: "One thing at a time",
      body:
        "Your day is a single card. Finish it, archive it, move on. No dashboards. No tabs of tabs.",
    },
    {
      title: "Notifications, off by default",
      body:
        "Lumen never pings you. A morning summary and an evening review — that's the whole rhythm.",
    },
    {
      title: "Quiet by design",
      body:
        "Type-first, keyboard-driven, made of paper-white panels. Nothing competes with the work.",
    },
    {
      title: "Yours to leave",
      body:
        "Every note exports as plain Markdown with one keystroke. No lock-in. Ever.",
    },
    {
      title: "Calm collaboration",
      body:
        "Share a single page with a single person. Threads are short, mentions are explicit.",
    },
    {
      title: "End-to-end encrypted",
      body:
        "Your notes are sealed before they leave your device. We can’t read them — and we like it that way.",
    },
  ];
  return (
    <section id="features" className="border-b border-line py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
            What you get
          </p>
          <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight sm:text-5xl">
            Less surface area, more{" "}
            <span className="font-serif italic">depth</span>.
          </h2>
          <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
            We removed everything that looks like productivity software.
            What&rsquo;s left is the part that helps you think.
          </p>
        </div>
        <ul className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <li
              key={it.title}
              className="group bg-background p-7 transition-colors hover:bg-card sm:p-8"
            >
              <div className="flex items-baseline gap-3 text-subtle">
                <span className="font-mono text-xs">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <h3 className="mt-6 text-lg font-medium tracking-tight text-foreground">
                {it.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{it.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      kicker: "Step 01",
      title: "Open Lumen in the morning",
      body:
        "Lumen suggests a single card for the day, drawn from the few promises you’ve made to yourself.",
    },
    {
      kicker: "Step 02",
      title: "Work in one window",
      body:
        "No tabs. No sidebars. Notes, todos, and timers all live inside the card you’re looking at.",
    },
    {
      kicker: "Step 03",
      title: "Close the day",
      body:
        "An evening review takes ninety seconds. Tomorrow is already drafted — you can change it, or not.",
    },
  ];
  return (
    <section id="how" className="border-b border-line py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
              How it works
            </p>
            <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight sm:text-5xl">
              A day in three{" "}
              <span className="font-serif italic">moves</span>.
            </h2>
            <p className="mt-4 text-base text-muted sm:text-lg">
              The whole product is built around a simple rhythm. Open, work,
              close — then live the rest of your life.
            </p>
          </div>
          <ol className="lg:col-span-8 lg:pl-8">
            {steps.map((s) => (
              <li
                key={s.kicker}
                className="grid grid-cols-12 gap-6 border-t border-line py-10 first:border-t-0 first:pt-0 sm:py-12"
              >
                <div className="col-span-12 sm:col-span-3">
                  <p className="font-mono text-xs uppercase tracking-wider text-subtle">
                    {s.kicker}
                  </p>
                </div>
                <div className="col-span-12 sm:col-span-9">
                  <h3 className="text-xl font-medium tracking-tight sm:text-2xl">
                    {s.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-base leading-relaxed text-muted">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Quote() {
  return (
    <section className="border-b border-line py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
          From the beta
        </p>
        <blockquote className="mt-6 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-5xl">
          &ldquo;I closed eleven tabs the day I opened Lumen. I haven&rsquo;t
          opened them since.&rdquo;
        </blockquote>
        <figcaption className="mt-8 text-sm text-muted">
          Maya Iyer · Founder, Atrium
        </figcaption>
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    {
      q: "Is Lumen another to-do app?",
      a: "No. Lumen is closer to a workshop than a list. You won’t find Kanban boards, tags, or weekly reviews — just one card to finish today.",
    },
    {
      q: "What about teams?",
      a: "Lumen is built for one person at a time. You can share a single card with a single collaborator, but there’s no team space, no @-everyone, no presence indicators.",
    },
    {
      q: "Is it free?",
      a: "Lumen will have a free tier for one card a day and a paid plan for unlimited cards, search, and export. Pricing is final at launch.",
    },
    {
      q: "Where is my data?",
      a: "Encrypted on your device first, then synced to our servers in the EU. You can export everything to Markdown at any time with a single keystroke.",
    },
    {
      q: "When can I try it?",
      a: "We’re sending invites in small batches starting this spring. Join the list above to get one.",
    },
  ];
  return (
    <section id="faq" className="border-b border-line py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
          Questions
        </p>
        <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight sm:text-5xl">
          The things people ask{" "}
          <span className="font-serif italic">first</span>.
        </h2>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {items.map((it) => (
            <details
              key={it.q}
              className="group [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-medium tracking-tight text-foreground sm:text-lg">
                <span>{it.q}</span>
                <span
                  aria-hidden
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-subtle transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-6 pr-10 text-base leading-relaxed text-muted">
                {it.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="border-b border-line bg-card py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-balance text-4xl font-medium tracking-tight sm:text-6xl">
          One <span className="font-serif italic">quiet</span> tool.
          <br />
          One inbox, twice a year.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          We open the door a few times a year. Drop your email and we&rsquo;ll
          send the next invite your way.
        </p>
        <div className="mt-8">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-foreground"
          />
          <span>Lumen · Made carefully in Lisbon</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground">
            Manifesto
          </a>
          <a href="#" className="hover:text-foreground">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
