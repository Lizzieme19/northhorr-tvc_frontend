import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { stats } from "@/lib/data";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About NTVC"
        title="Northern Kenya's home for skill, innovation and service."
        description="Established to bridge the skills gap in Marsabit County, NTVC has grown into a leading TVET institution serving learners from across Kenya."
        image="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=2000&q=80"
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
              alt="Graduation"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-terracotta font-semibold text-sm uppercase tracking-widest">
              Our Story
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-brand-dark">
              From a small training centre to a regional TVET hub.
            </h2>
            <p className="mt-5 text-stone leading-relaxed">
              North Horr TVC was born out of a vision to bring quality
              technical education closer to the people of Marsabit County.
              From humble beginnings, we have grown into a fully-fledged
              vocational college offering Level 3–6 programs, accredited by
              TVETA, KNEC and KNQA.
            </p>
            <p className="mt-4 text-stone leading-relaxed">
              Today, our graduates are employed across Kenya as electricians,
              farmers, fashion designers, ICT technicians, community health
              workers and entrepreneurs — driving real change in their
              communities.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream-deep">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🎯",
              title: "Mission",
              text: "To provide quality, accessible and industry-relevant TVET education that empowers learners to drive social and economic transformation.",
            },
            {
              icon: "👁️",
              title: "Vision",
              text: "To be the leading vocational training institution in Northern Kenya — recognised for excellence, innovation and integrity.",
            },
            {
              icon: "💎",
              title: "Core Values",
              text: "Excellence • Integrity • Inclusivity • Innovation • Service to community.",
            },
          ].map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-2xl p-7 border border-stone/15"
            >
              <div className="h-14 w-14 rounded-2xl bg-brand grid place-items-center text-3xl">
                {b.icon}
              </div>
              <h3 className="mt-5 font-display text-xl text-brand-dark">
                {b.title}
              </h3>
              <p className="mt-2 text-stone leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="text-center p-8 bg-white rounded-2xl border border-stone/15"
              >
                <div className="font-display text-4xl text-brand">{s.value}</div>
                <div className="mt-1 text-stone text-sm uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl">A word from the Principal</h2>
          <p className="mt-6 text-cream/85 text-lg italic leading-relaxed">
            &ldquo;At NTVC we believe every learner has within them a spark of
            greatness. Our role is simply to ignite it — through quality
            instruction, modern facilities and a community that cares. Welcome
            home.&rdquo;
          </p>
          <div className="mt-6 font-display text-gold">— The Principal, NTVC</div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl text-brand-dark">
            Be part of our story.
          </h2>
          <Link
            href="/courses"
            className="inline-block mt-6 px-7 py-3.5 rounded-full bg-gold text-brand-dark font-semibold hover:bg-gold-soft transition shadow"
          >
            Explore Courses →
          </Link>
        </div>
      </section>
    </>
  );
}
