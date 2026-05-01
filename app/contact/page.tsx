import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import ContactForm from "@/components/pages/ContactForm";
import { collegeInfo } from "@/lib/data";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  const contactCards = [
    { icon: "📍", title: "Visit", lines: [collegeInfo.location, collegeInfo.poBox] },
    { icon: "📞", title: "Call", lines: [collegeInfo.phone, "Mon–Fri, 8am–5pm"] },
    { icon: "✉️", title: "Email", lines: [collegeInfo.email, collegeInfo.admissionsEmail] },
  ];

  return (
    <>
      <PageHero
        eyebrow="Get In Touch"
        title="We'd love to hear from you."
        description="Whether you're a prospective student, parent, partner or member of the press — our team is here to help."
        image="https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=2000&q=80"
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-3 gap-6 mb-12">
          {contactCards.map((c) => (
            <div
              key={c.title}
              className="p-7 bg-white rounded-2xl border border-stone/15 hover:border-gold hover:shadow-md transition"
            >
              <div className="h-14 w-14 rounded-2xl bg-cream-deep grid place-items-center text-3xl">
                {c.icon}
              </div>
              <h3 className="mt-4 font-display text-xl text-brand-dark">{c.title}</h3>
              {c.lines.map((line) => (
                <div key={line} className="text-stone mt-1">
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-8">
          <ContactForm />

          <div className="space-y-6">
            <div className="rounded-3xl overflow-hidden border border-stone/15 shadow-lg aspect-[4/3] bg-cream-deep">
              <iframe
                title="NTVC location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=37.0%2C3.2%2C37.4%2C3.4&layer=mapnik&marker=3.32%2C37.10"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
            <div className="bg-brand text-cream p-7 rounded-3xl">
              <h3 className="font-display text-xl">Follow us</h3>
              <p className="text-cream/80 mt-1 text-sm">
                Stay connected on social media for daily campus updates.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  { name: "Facebook", href: collegeInfo.socials.facebook },
                  { name: "Twitter", href: collegeInfo.socials.twitter },
                  { name: "Instagram", href: collegeInfo.socials.instagram },
                  { name: "YouTube", href: collegeInfo.socials.youtube },
                  { name: "LinkedIn", href: collegeInfo.socials.linkedin },
                ].map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-full bg-cream/10 hover:bg-gold hover:text-brand-dark text-cream text-sm font-medium transition"
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
