import Image from "next/image";

export type StaffMember = {
  name: string;
  title: string;
  department: string;
  image: string;
  phone?: string;
  email?: string;
  description: string;
  quote?: string;
};

interface StaffCardProps {
  staff: StaffMember;
  variant?: "default" | "full";
}

export function StaffCard({ staff, variant = "default" }: StaffCardProps) {
  if (variant === "full") {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 items-start">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-xl order-1 md:order-1">
              <Image
                src={staff.image}
                alt={staff.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="md:col-span-2 order-2 md:order-2">
              <span className="text-terracotta text-xs sm:text-sm font-semibold uppercase tracking-widest">
                {staff.department}
              </span>
              <h2 className="mt-3 font-display text-2xl sm:text-3xl text-brand-dark">
                {staff.name}
              </h2>
              <p className="mt-2 text-brand font-semibold text-base sm:text-lg">
                {staff.title}
              </p>
              <p className="mt-4 sm:mt-5 text-stone text-sm sm:text-base leading-relaxed">
                {staff.description}
              </p>
              {staff.quote && (
                <blockquote className="mt-6 p-4 sm:p-6 bg-cream-deep rounded-xl border-l-4 border-brand">
                  <p className="text-stone text-sm sm:text-base italic leading-relaxed">
                    &ldquo;{staff.quote}&rdquo;
                  </p>
                </blockquote>
              )}
              {(staff.phone || staff.email) && (
                <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                  {staff.phone && (
                    <a
                      href={`tel:${staff.phone}`}
                      className="flex items-center gap-2 text-brand hover:text-terracotta transition text-sm sm:text-base"
                    >
                      <span>📞</span> {staff.phone}
                    </a>
                  )}
                  {staff.email && (
                    <a
                      href={`mailto:${staff.email}`}
                      className="flex items-center gap-2 text-brand hover:text-terracotta transition text-sm sm:text-base break-all"
                    >
                      <span>✉️</span> {staff.email}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone/15 overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="relative aspect-[4/3]">
        <Image
          src={staff.image}
          alt={staff.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-6">
        <span className="text-terracotta text-xs font-semibold uppercase tracking-widest">
          {staff.department}
        </span>
        <h3 className="mt-2 font-display text-xl text-brand-dark">
          {staff.name}
        </h3>
        <p className="mt-1 text-brand font-medium">{staff.title}</p>
        <p className="mt-3 text-stone text-sm leading-relaxed line-clamp-3">
          {staff.description}
        </p>
        {(staff.phone || staff.email) && (
          <div className="mt-4 pt-4 border-t border-stone/10 flex flex-wrap gap-3 text-sm">
            {staff.phone && (
              <a
                href={`tel:${staff.phone}`}
                className="text-stone hover:text-brand transition"
              >
                📞 {staff.phone}
              </a>
            )}
            {staff.email && (
              <a
                href={`mailto:${staff.email}`}
                className="text-stone hover:text-brand transition"
              >
                ✉️ {staff.email}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
