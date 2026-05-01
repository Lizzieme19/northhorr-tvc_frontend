import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { newsItems } from "@/lib/data";

export const metadata: Metadata = { title: "News & Events" };

export default function NewsPage() {
  const [featured, ...rest] = newsItems;
  return (
    <>
      <PageHero
        eyebrow="News & Events"
        title="What's happening at NTVC."
        description="Stay up to date with college announcements, achievements and upcoming events."
        image="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=2000&q=80"
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <article className="grid lg:grid-cols-2 gap-8 items-center bg-white rounded-3xl overflow-hidden shadow-lg">
            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full">
              <Image src={featured.image} alt={featured.title} fill className="object-cover" />
            </div>
            <div className="p-8 lg:p-12">
              <div className="flex items-center gap-3 text-xs">
                <span className="px-3 py-1 rounded-full bg-gold text-brand-dark font-semibold uppercase tracking-wider">
                  Featured
                </span>
                <span className="px-3 py-1 rounded-full bg-cream-deep text-brand font-semibold">
                  {featured.category}
                </span>
                <span className="text-stone">{featured.date}</span>
              </div>
              <h2 className="mt-4 font-display text-3xl text-brand-dark">
                {featured.title}
              </h2>
              <p className="mt-4 text-stone leading-relaxed">{featured.excerpt}</p>
              <Link
                href="#"
                className="inline-flex mt-6 px-6 py-3 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition"
              >
                Read full story
              </Link>
            </div>
          </article>

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((n) => (
              <article
                key={n.id}
                className="group bg-white rounded-2xl overflow-hidden border border-stone/15 hover:shadow-xl hover:-translate-y-1 transition"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={n.image}
                    alt={n.title}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-700"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-cream/95 text-brand text-xs font-semibold">
                    {n.category}
                  </span>
                </div>
                <div className="p-6">
                  <div className="text-xs text-stone">{n.date}</div>
                  <h3 className="mt-2 font-display font-semibold text-lg text-brand-dark group-hover:text-brand transition">
                    {n.title}
                  </h3>
                  <p className="mt-2 text-sm text-stone line-clamp-3">{n.excerpt}</p>
                  <Link href="#" className="inline-block mt-4 text-terracotta font-semibold text-sm">
                    Read more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
