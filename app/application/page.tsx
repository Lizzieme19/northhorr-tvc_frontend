import type { Metadata } from "next";
import ApplicationForm from "@/components/pages/ApplicationForm";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Apply Online" };

export default function ApplicationPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Apply for the next intake."
        description="Join North Horr TVC. Fill the form below to begin your journey. Direct walk-in and mature entry applications accepted."
        image="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2000&q=80"
      />
      <section className="py-16 bg-cream-deep">
        <div className="mx-auto max-w-4xl px-6">
          <div className="bg-white rounded-3xl shadow-xl border border-stone/15 p-8 sm:p-12">
            <ApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}