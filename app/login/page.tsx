import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <section className="min-h-[80vh] grid place-items-center px-6 py-16">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-stone/15">
        <Link href="/" className="text-sm text-brand hover:text-terracotta">
          ← Back to website
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-brand grid place-items-center text-cream font-display font-extrabold">
            NT
          </div>
          <div>
            <h1 className="font-display text-2xl text-brand-dark">Portal Login</h1>
            <p className="text-xs text-stone">Students & Administration</p>
          </div>
        </div>

        <form className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">
              Admission / Staff No.
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-stone/25 bg-cream/40 px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
              placeholder="e.g. NTVC/2025/0001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-stone/25 bg-cream/40 px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="button"
            className="w-full px-6 py-3.5 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition shadow"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <a href="#" className="text-terracotta font-medium hover:underline">
            Forgot password?
          </a>
        </div>
        <div className="mt-6 p-3 rounded-xl bg-gold/15 border border-gold/30 text-xs text-brand-dark text-center">
          🛠️ Authentication is not yet wired up. This is a UI placeholder for
          the upcoming dashboard.
        </div>
      </div>
    </section>
  );
}
