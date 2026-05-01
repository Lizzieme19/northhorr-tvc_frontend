"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    // Frontend-only placeholder — replace with API call later.
    await new Promise((r) => setTimeout(r, 900));
    setStatus("sent");
    (e.currentTarget as HTMLFormElement).reset();
    setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white p-8 rounded-3xl shadow-lg border border-stone/10 space-y-5"
    >
      <h2 className="font-display text-2xl text-brand-dark">Send us a message</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field name="name" label="Full Name" required />
        <Field name="email" label="Email" type="email" required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field name="phone" label="Phone" />
        <Field name="subject" label="Subject" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1.5">
          Message <span className="text-terracotta">*</span>
        </label>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-stone/25 bg-cream/40 px-4 py-3 focus:outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 transition resize-none"
          placeholder="Tell us how we can help..."
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition shadow disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : status === "sent" ? "✓ Sent!" : "Send Message"}
      </button>
      {status === "sent" && (
        <p className="text-sm text-brand">
          Thank you — we&apos;ll get back to you within 1 business day.
        </p>
      )}
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-dark mb-1.5">
        {label}
        {required ? <span className="text-terracotta"> *</span> : null}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-stone/25 bg-cream/40 px-4 py-3 focus:outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 transition"
      />
    </div>
  );
}
