"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle"
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    await new Promise((r) => setTimeout(r, 600));
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-line bg-card px-5 py-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <p className="text-sm font-medium text-foreground">
          You&rsquo;re on the list.
        </p>
        <p className="mt-1 text-sm text-muted">
          We&rsquo;ll be in touch from <span className="font-mono">hello@lumen.app</span> when your invite is ready.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center"
    >
      <label htmlFor="email" className="sr-only">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@studio.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        className="flex-1 rounded-lg border border-line bg-card px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:border-foreground focus:outline-none"
        aria-invalid={status === "error"}
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="group inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Joining…" : "Request invite"}
        <span
          aria-hidden
          className="transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      </button>
      {status === "error" && (
        <p className="sr-only" role="alert">
          Please enter a valid email.
        </p>
      )}
    </form>
  );
}
