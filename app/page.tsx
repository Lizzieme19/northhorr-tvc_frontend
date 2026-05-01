import Image from "next/image";
import Link from "next/link";
import { departments, newsItems, stats, testimonials } from "@/lib/data";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2000&q=80"
            alt="NTVC campus"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/95 via-brand/85 to-brand-dark/70" />
          <div className="absolute inset-0 bg-dots opacity-30" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-cream animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/20 text-gold border border-gold/40 text-xs font-semibold tracking-wider uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              September 2025 Intake Open
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
              Igniting a <span className="text-gold">brighter</span>{" "}
              future through skill.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-cream/85 max-w-xl leading-relaxed">
              North Horr Technical and Vocational College offers accredited
              Level 3–6 TVET programs across nine departments — from
              agriculture and engineering to ICT and fashion.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/courses"
                className="px-7 py-3.5 rounded-full bg-gold text-brand-dark font-semibold hover:bg-gold-soft transition shadow-lg shadow-gold/20"
              >
                Explore Courses →
              </Link>
              <Link
                href="/about"
                className="px-7 py-3.5 rounded-full border-2 border-cream/30 text-cream hover:border-gold hover:text-gold transition backdrop-blur-sm"
              >
                About the College
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-display font-bold text-gold">
                    {s.value}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-cream/70 mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block relative animate-fade-in">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-8 border-cream/10 rotate-2">
              <Image
                src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1000&q=80"
                alt="Student in workshop"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-44 aspect-square rounded-2xl overflow-hidden shadow-xl border-4 border-cream/20 -rotate-6">
              <Image
                src="https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?auto=format&fit=crop&w=600&q=80"
                alt="Carpentry trainee"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -top-4 -right-4 px-5 py-3 bg-cream rounded-2xl shadow-xl rotate-3">
              <div className="text-xs text-stone uppercase tracking-wider">Accredited by</div>
              <div className="font-display font-bold text-brand">TVETA & KNQA</div>
            </div>
          </div>
        </div>
      </section>

      {/* WELCOME / ABOUT */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div className="relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80"
                alt="NTVC campus building"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-4 sm:-right-8 bg-brand text-cream rounded-2xl p-6 shadow-2xl max-w-xs">
              <div className="font-display text-3xl font-bold text-gold">15+</div>
              <div className="text-sm text-cream/80">
                Years training Northern Kenya's skilled workforce
              </div>
            </div>
            <div className="absolute -top-6 -left-4 hidden sm:flex h-24 w-24 rounded-full bg-gold/20 border-4 border-gold/40 items-center justify-center">
              <span className="text-3xl">🎓</span>
            </div>
          </div>

          <div>
            <span className="text-terracotta font-semibold text-sm uppercase tracking-widest">
              Welcome to NTVC
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-brand-dark">
              A premier TVET institution in Northern Kenya.
            </h2>
            <p className="mt-5 text-stone leading-relaxed">
              For over a decade, North Horr Technical and Vocational College
              has been at the forefront of skills development in Marsabit
              County. We combine industry-relevant curricula, modern
              facilities, and dedicated trainers to prepare graduates who are
              ready to work, ready to innovate, and ready to lead.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "TVETA-accredited Level 3–6 qualifications",
                "Modern workshops, ICT and science laboratories",
                "HELB-funded study options available",
                "Strong industry attachment & job-placement support",
              ].map((p) => (
                <li key={p} className="flex gap-3 items-start">
                  <span className="mt-1 h-5 w-5 rounded-full bg-brand grid place-items-center text-cream text-xs flex-shrink-0">
                    ✓
                  </span>
                  <span className="text-foreground">{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-4">
              <Link
                href="/about"
                className="px-6 py-3 rounded-full bg-brand text-cream font-medium hover:bg-brand-dark transition"
              >
                Learn More
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 rounded-full text-brand font-medium hover:text-terracotta transition"
              >
                Visit Campus →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="py-20 bg-cream-deep relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand via-gold to-terracotta" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-terracotta font-semibold text-sm uppercase tracking-widest">
                Our Departments
              </span>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl text-brand-dark max-w-2xl">
                Nine departments. Sixty-plus courses. One brighter future.
              </h2>
            </div>
            <Link
              href="/courses"
              className="text-brand font-semibold hover:text-terracotta transition"
            >
              View all programs →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((d) => (
              <Link
                key={d.slug}
                href={`/courses/${d.slug}`}
                className="group relative bg-white rounded-2xl overflow-hidden border border-stone/15 hover:border-brand/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={d.image}
                    alt={d.name}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/10 to-transparent" />
                  <div className="absolute top-3 left-3 h-11 w-11 rounded-xl bg-cream/95 grid place-items-center text-2xl shadow-lg">
                    {d.icon}
                  </div>
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-gold text-brand-dark text-xs font-semibold">
                    {d.courses.length} courses
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-semibold text-lg text-brand-dark group-hover:text-brand transition">
                    {d.name}
                  </h3>
                  <p className="text-sm text-stone mt-1.5 line-clamp-2">
                    {d.tagline}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm text-terracotta font-medium">
                    Explore courses
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-terracotta font-semibold text-sm uppercase tracking-widest">
              Why NTVC
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-brand-dark">
              Built for the workplace of tomorrow.
            </h2>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🛠️", title: "Hands-on Training", text: "70% practical learning in modern workshops with real industry tools." },
              { icon: "📜", title: "Accredited Certificates", text: "Recognized by TVETA, KNQA and the Ministry of Education." },
              { icon: "🤝", title: "Industry Partners", text: "Strong attachment & employment links with leading Kenyan employers." },
              { icon: "💸", title: "Affordable & Funded", text: "HELB-eligible programs and flexible payment plans for every learner." },
            ].map((f) => (
              <div
                key={f.title}
                className="group p-7 bg-white rounded-2xl border border-stone/15 hover:border-gold hover:shadow-xl transition"
              >
                <div className="h-14 w-14 rounded-2xl bg-cream-deep group-hover:bg-gold/20 grid place-items-center text-3xl transition">
                  {f.icon}
                </div>
                <h3 className="mt-5 font-display font-semibold text-lg text-brand-dark">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-stone leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS & EVENTS */}
      <section className="py-20 bg-cream-deep">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-terracotta font-semibold text-sm uppercase tracking-widest">
                Latest Updates
              </span>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl text-brand-dark">
                News & upcoming events.
              </h2>
            </div>
            <Link href="/news" className="text-brand font-semibold hover:text-terracotta transition">
              All news →
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Featured */}
            <article className="lg:row-span-2 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition group">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={newsItems[0].image}
                  alt={newsItems[0].title}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-700"
                />
              </div>
              <div className="p-7">
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-3 py-1 rounded-full bg-gold/20 text-brand-dark font-semibold">
                    {newsItems[0].category}
                  </span>
                  <span className="text-stone">{newsItems[0].date}</span>
                </div>
                <h3 className="mt-4 font-display text-2xl text-brand-dark group-hover:text-brand transition">
                  {newsItems[0].title}
                </h3>
                <p className="mt-3 text-stone leading-relaxed">{newsItems[0].excerpt}</p>
                <Link href="/news" className="inline-flex mt-5 text-terracotta font-semibold">
                  Read more →
                </Link>
              </div>
            </article>

            {newsItems.slice(1, 4).map((n) => (
              <article key={n.id} className="bg-white rounded-2xl overflow-hidden flex shadow-sm hover:shadow-xl transition group">
                <div className="relative w-32 sm:w-40 flex-shrink-0">
                  <Image src={n.image} alt={n.title} fill className="object-cover" />
                </div>
                <div className="p-5 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-cream-deep text-brand font-semibold">
                      {n.category}
                    </span>
                    <span className="text-stone">{n.date}</span>
                  </div>
                  <h3 className="mt-2 font-display font-semibold text-brand-dark group-hover:text-brand transition line-clamp-2">
                    {n.title}
                  </h3>
                  <p className="mt-1 text-sm text-stone line-clamp-2">{n.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-terracotta font-semibold text-sm uppercase tracking-widest">
              Success Stories
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-brand-dark">
              Where our graduates are today.
            </h2>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <figure
                key={t.name}
                className={`relative p-7 rounded-2xl border border-stone/15 ${
                  i === 1 ? "bg-brand text-cream" : "bg-white"
                }`}
              >
                <div className={`text-5xl font-display leading-none ${i === 1 ? "text-gold" : "text-terracotta/40"}`}>
                  &ldquo;
                </div>
                <blockquote className={`mt-2 leading-relaxed ${i === 1 ? "text-cream" : "text-foreground"}`}>
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-gold">
                    <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                  </div>
                  <div>
                    <div className={`font-display font-semibold ${i === 1 ? "text-cream" : "text-brand-dark"}`}>
                      {t.name}
                    </div>
                    <div className={`text-xs ${i === 1 ? "text-gold" : "text-stone"}`}>
                      {t.course} • {t.year}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=2000&q=80"
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-brand-dark/90" />
        </div>
        <div className="mx-auto max-w-4xl px-6 py-24 text-center text-cream">
          <h2 className="font-display text-3xl sm:text-5xl">
            Your future starts at <span className="text-gold">NTVC</span>.
          </h2>
          <p className="mt-5 text-cream/85 text-lg">
            Apply for the September intake today and join a community of
            learners shaping Northern Kenya's tomorrow.
          </p>
          <div className="mt-9 flex flex-wrap gap-4 justify-center">
            <Link
              href="/courses"
              className="px-7 py-3.5 rounded-full bg-gold text-brand-dark font-semibold hover:bg-gold-soft transition shadow-lg"
            >
              Apply Now →
            </Link>
            <Link
              href="/resources"
              className="px-7 py-3.5 rounded-full border-2 border-cream/40 text-cream hover:border-gold hover:text-gold transition"
            >
              Download Prospectus
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
