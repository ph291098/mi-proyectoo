"use client";

import { useState } from "react";

export function AccessForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle"
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !company.trim()) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    await new Promise((r) => setTimeout(r, 700));
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="glass-strong mx-auto max-w-md rounded-2xl px-5 py-4 text-left">
        <p className="text-sm font-medium text-foreground">
          Request received.
        </p>
        <p className="mt-1 text-sm text-muted">
          A wholesale specialist will reach out within 24 hours from{" "}
          <span className="font-mono text-accent">partners@atlas.co</span>.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`mx-auto w-full ${compact ? "max-w-md" : "max-w-xl"}`}
    >
      <div
        className={`glass-strong rounded-2xl p-1.5 ${
          compact ? "" : "sm:p-2"
        } flex flex-col gap-1.5 sm:flex-row sm:items-center`}
      >
        <input
          type="text"
          required
          autoComplete="organization"
          placeholder="Company name"
          value={company}
          onChange={(e) => {
            setCompany(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          className="flex-1 rounded-xl bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:outline-none"
          aria-invalid={status === "error" && !company.trim()}
        />
        <span className="hidden h-6 w-px bg-line sm:block" />
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="work@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          className="flex-1 rounded-xl bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:outline-none"
          aria-invalid={
            status === "error" &&
            (!email || !/^\S+@\S+\.\S+$/.test(email))
          }
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl px-5 py-3 text-sm font-medium text-background transition disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background:
              "linear-gradient(110deg, #5eead4 0%, #a78bfa 50%, #f472b6 100%)",
          }}
        >
          <span className="relative z-10">
            {status === "submitting" ? "Submitting…" : "Request access"}
          </span>
          <span
            aria-hidden
            className="relative z-10 transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-xs text-accent-3" role="alert">
          Add a company name and a valid work email.
        </p>
      )}
    </form>
  );
}
