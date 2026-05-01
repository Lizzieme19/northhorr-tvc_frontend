import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { departments } from "@/lib/data";

export function generateStaticParams() {
  return departments.map((d) => ({ department: d.slug }));
}

export async function generateMetadata(
  props: PageProps<"/courses/[department]">
): Promise<Metadata> {
  const { department } = await props.params;
  const dep = departments.find((d) => d.slug === department);
  return { title: dep ? dep.name : "Department" };
}

export default async function DepartmentPage(
  props: PageProps<"/courses/[department]">
) {
  const { department } = await props.params;
  const dep = departments.find((d) => d.slug === department);
  if (!dep) notFound();

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src={dep.image} alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/95 via-brand/85 to-brand-dark/70" />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28 text-cream">
          <Link
            href="/courses"
            className="text-cream/70 hover:text-gold text-sm"
          >
            ← All departments
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-cream/95 grid place-items-center text-4xl shadow-lg">
              {dep.icon}
            </div>
            <div>
              <span className="text-gold text-xs font-semibold uppercase tracking-widest">
                Department
              </span>
              <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">
                {dep.name}
              </h1>
            </div>
          </div>
          <p className="mt-5 text-cream/85 text-lg max-w-2xl italic">
            “{dep.tagline}”
          </p>
          <p className="mt-3 text-cream/80 max-w-3xl">{dep.description}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-terracotta text-sm font-semibold uppercase tracking-widest">
                Available Courses
              </span>
              <h2 className="mt-2 font-display text-3xl text-brand-dark">
                {dep.courses.length} accredited programs
              </h2>
            </div>
            <Link
              href="/contact"
              className="hidden sm:inline-block px-5 py-2.5 rounded-full bg-brand text-cream font-medium hover:bg-brand-dark transition"
            >
              Apply Now
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dep.courses.map((c, i) => (
              <div
                key={c.name}
                className="group p-6 bg-white rounded-2xl border border-stone/15 hover:border-gold hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-2xl">📘</span>
                </div>
                <h3 className="mt-3 font-display font-semibold text-lg text-brand-dark group-hover:text-brand transition">
                  {c.name}
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.levels.split(",").map((l) => (
                    <span
                      key={l}
                      className="text-xs px-2.5 py-1 rounded-full bg-cream-deep text-brand font-medium"
                    >
                      {l.trim()}
                    </span>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-stone/10 flex items-center justify-between">
                  <span className="text-sm text-stone">Full-time</span>
                  <span className="text-sm font-semibold text-terracotta">
                    Enquire →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream-deep">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl text-brand-dark">
            Ready to enrol in {dep.name}?
          </h2>
          <p className="mt-3 text-stone">
            Speak to our admissions team or download the prospectus to learn
            more about fees, requirements and intakes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link
              href="/contact"
              className="px-7 py-3 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition"
            >
              Contact Admissions
            </Link>
            <Link
              href="/resources"
              className="px-7 py-3 rounded-full bg-gold text-brand-dark font-semibold hover:bg-gold-soft transition"
            >
              Download Prospectus
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
