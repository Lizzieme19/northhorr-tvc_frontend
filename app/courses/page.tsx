import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { departments } from "@/lib/data";

export const metadata: Metadata = { title: "Courses & Programs" };

export default function CoursesPage() {
  const totalCourses = departments.reduce((s, d) => s + d.courses.length, 0);

  return (
    <>
      <PageHero
        eyebrow="Courses & Programs"
        title="Find your path. Master a trade. Build your future."
        description={`Explore ${totalCourses}+ accredited TVET courses across ${departments.length} departments. Levels 3, 4, 5 and 6 — designed to make you industry-ready.`}
        image="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=2000&q=80"
      />

      {/* Department quick-nav */}
      <section className="sticky top-[64px] lg:top-[88px] z-30 bg-cream/95 backdrop-blur border-b border-stone/15">
        <div className="mx-auto max-w-7xl px-6 py-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {departments.map((d) => (
              <a
                key={d.slug}
                href={`#${d.slug}`}
                className="px-4 py-2 rounded-full text-sm font-medium text-brand-dark bg-white border border-stone/15 hover:bg-brand hover:text-cream hover:border-brand transition whitespace-nowrap"
              >
                {d.icon} {d.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 space-y-20">
          {departments.map((d, idx) => (
            <article
              key={d.slug}
              id={d.slug}
              className="scroll-mt-40 grid lg:grid-cols-3 gap-10"
            >
              <header className="lg:sticky lg:top-44 lg:self-start">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                  <Image src={d.image} alt={d.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 to-transparent" />
                  <div className="absolute top-3 left-3 h-12 w-12 rounded-xl bg-cream grid place-items-center text-2xl shadow-lg">
                    {d.icon}
                  </div>
                </div>
                <div className="mt-5">
                  <span className="text-terracotta text-xs font-semibold uppercase tracking-widest">
                    Department {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h2 className="mt-2 font-display text-2xl text-brand-dark">
                    {d.name}
                  </h2>
                  <p className="mt-2 text-stone leading-relaxed">{d.description}</p>
                  <Link
                    href={`/courses/${d.slug}`}
                    className="inline-block mt-4 text-brand font-semibold hover:text-terracotta transition"
                  >
                    View department page →
                  </Link>
                </div>
              </header>

              <div className="lg:col-span-2">
                <div className="grid sm:grid-cols-2 gap-3">
                  {d.courses.map((c) => (
                    <div
                      key={c.name}
                      className="group p-5 bg-white rounded-xl border border-stone/15 hover:border-brand/50 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display font-semibold text-brand-dark group-hover:text-brand transition">
                          {c.name}
                        </h3>
                        <span className="text-lg shrink-0">📘</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.levels.split(",").map((l) => (
                          <span
                            key={l}
                            className="text-xs px-2 py-0.5 rounded-full bg-cream-deep text-brand font-medium"
                          >
                            {l.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="py-20 bg-cream-deep">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl text-brand-dark">
            Not sure which course to pick?
          </h2>
          <p className="mt-4 text-stone">
            Our admissions team is happy to walk you through the right path
            for your goals and qualifications.
          </p>
          <Link
            href="/contact"
            className="inline-block mt-6 px-7 py-3.5 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition shadow"
          >
            Talk to Admissions →
          </Link>
        </div>
      </section>
    </>
  );
}
