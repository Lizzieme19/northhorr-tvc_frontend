import Link from "next/link";
import { collegeInfo, departments } from "@/lib/data";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-cream/80 mt-24">
      <div className="bg-brand">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl text-cream font-semibold">
              Ready to start your journey?
            </h3>
            <p className="text-cream/80 mt-1">
              Join hundreds of students transforming their lives at NTVC.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/courses"
              className="px-6 py-3 rounded-full bg-gold text-brand-dark font-semibold hover:bg-gold-soft transition shadow"
            >
              Browse Courses
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-full border-2 border-cream/40 text-cream hover:border-gold hover:text-gold transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Image src={'/Logo/NorthHorr.png'} width={100} height={100} alt="NorthHorr" />
            <div>
              <div className="font-display text-cream font-bold">{collegeInfo.shortName}</div>
              <div className="text-xs text-gold">{collegeInfo.tagline}</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            North Horr Technical and Vocational College — empowering Northern
            Kenya through quality, accredited TVET education.
          </p>
          <div className="flex gap-3 mt-5">
            {[
              { name: "Facebook", href: collegeInfo.socials.facebook, d: "M22 12a10 10 0 1 0-11.6 9.9V14.9H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.4v6.9A10 10 0 0 0 22 12z" },
              { name: "Twitter", href: collegeInfo.socials.twitter, d: "M22 5.8c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1A4.1 4.1 0 0 0 11.7 9c-3.4-.2-6.4-1.8-8.5-4.3a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5 0 2 1.4 3.7 3.3 4.1-.6.2-1.2.2-1.8.1.5 1.6 2 2.8 3.8 2.8A8.3 8.3 0 0 1 2 18.4c1.8 1.2 4 1.9 6.3 1.9 7.5 0 11.6-6.2 11.6-11.6v-.5c.8-.6 1.5-1.3 2.1-2.1z" },
              { name: "Instagram", href: collegeInfo.socials.instagram, d: "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4 1 .5.4.7.8 1 1.4.2.4.3 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-1 1.4-.4.5-.8.7-1.4 1-.4.2-1 .3-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4a3.7 3.7 0 0 1-1.4-1c-.5-.4-.7-.8-1-1.4-.2-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 1-1.4.4-.5.8-.7 1.4-1 .4-.2 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 5.8.1 5 .3 4.2.6c-.8.3-1.5.7-2.2 1.4C1.3 2.7.9 3.4.6 4.2.3 5 .1 5.8.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.3.3 2.1.6 2.9.3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.6.5 2.9.6 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c1.3-.1 2.1-.3 2.9-.6.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.5-1.6.6-2.9.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.3-.3-2.1-.6-2.9a5.9 5.9 0 0 0-1.4-2.2A5.9 5.9 0 0 0 19.8.6c-.8-.3-1.6-.5-2.9-.6C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.4a1.4 1.4 0 1 1-2.9 0 1.4 1.4 0 0 1 2.9 0z" },
              { name: "YouTube", href: collegeInfo.socials.youtube, d: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" },
            ].map((s) => (
              <a
                key={s.name}
                href={s.href}
                aria-label={s.name}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 grid place-items-center rounded-full bg-brand text-cream hover:bg-gold hover:text-brand-dark transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d={s.d} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-cream font-display font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/about", label: "About NTVC" },
              { href: "/courses", label: "Courses" },
              { href: "/news", label: "News & Events" },
              { href: "/gallery", label: "Gallery" },
              { href: "/resources", label: "Downloads" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-gold transition">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-cream font-display font-semibold mb-4">Departments</h4>
          <ul className="space-y-2 text-sm">
            {departments.slice(0, 6).map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/courses/${d.slug}`}
                  className="hover:text-gold transition"
                >
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-cream font-display font-semibold mb-4">Get In Touch</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <span>📍</span>
              <span>{collegeInfo.location}<br />{collegeInfo.poBox}</span>
            </li>
            <li className="flex gap-2">
              <span>📞</span>
              <a href={`tel:${collegeInfo.phone}`} className="hover:text-gold transition">{collegeInfo.phone}</a>
            </li>
            <li className="flex gap-2">
              <span>✉️</span>
              <a href={`mailto:${collegeInfo.email}`} className="hover:text-gold transition">{collegeInfo.email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto max-w-7xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream/60">
          <p>© {new Date().getFullYear()} North Horr Technical and Vocational College. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-gold">Privacy</Link>
            <Link href="/terms" className="hover:text-gold">Terms</Link>
            <Link href="/login" className="hover:text-gold">Staff Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
