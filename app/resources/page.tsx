import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { resources } from "@/lib/data";

export const metadata: Metadata = { title: "Downloadable Resources" };

const categories = ["Prospectus", "Forms", "Timetables", "Policies"] as const;

const typeColors: Record<string, string> = {
  PDF: "bg-terracotta/15 text-terracotta",
  DOCX: "bg-sky/15 text-sky",
  ZIP: "bg-gold/15 text-brand-dark",
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Downloads"
        title="Resources at your fingertips."
        description="Download the prospectus, application forms, timetables and student policies — all in one place."
        image="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=2000&q=80"
      />

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6 space-y-14">
          {categories.map((cat) => {
            const items = resources.filter((r) => r.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-1.5 rounded-full bg-gold" />
                  <h2 className="font-display text-2xl text-brand-dark">{cat}</h2>
                  <span className="text-stone text-sm">({items.length})</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {items.map((r) => (
                    <div
                      key={r.title}
                      className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-stone/15 hover:border-brand hover:shadow-md transition"
                    >
                      <div
                        className={`h-14 w-14 rounded-xl grid place-items-center font-display font-bold text-sm ${typeColors[r.type]}`}
                      >
                        {r.type}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-brand-dark truncate">
                          {r.title}
                        </h3>
                        <p className="text-sm text-stone line-clamp-1">
                          {r.description}
                        </p>
                        <div className="mt-1 text-xs text-stone-soft">{r.size}</div>
                      </div>
                      <button
                        className="shrink-0 px-4 py-2 rounded-full bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition"
                        title="Download"
                      >
                        ↓ Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-16 bg-cream-deep">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-2xl text-brand-dark">
            Need something else?
          </h2>
          <p className="mt-3 text-stone">
            If you can't find a document you're looking for, please reach out
            to our admissions office.
          </p>
        </div>
      </section>
    </>
  );
}
