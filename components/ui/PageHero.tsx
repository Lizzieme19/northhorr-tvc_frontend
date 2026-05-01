import Image from "next/image";

export function PageHero({
  eyebrow,
  title,
  description,
  image,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {image ? (
          <Image src={image} alt="" fill className="object-cover" priority />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/95 via-brand/90 to-brand-dark/80" />
        <div className="absolute inset-0 bg-dots opacity-30" />
      </div>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28 text-cream">
        {eyebrow ? (
          <span className="inline-block px-4 py-1 rounded-full bg-gold/20 text-gold border border-gold/40 text-xs font-semibold uppercase tracking-widest">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-bold max-w-3xl leading-[1.05]">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 text-cream/85 text-lg max-w-2xl">{description}</p>
        ) : null}
      </div>
    </section>
  );
}
