import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import ApplicationForm from "@/components/pages/ApplicationForm";

export const metadata: Metadata = { title: "Application Form" };

export default function ApplicationPage() {
  return (
    <>
      <PageHero
        eyebrow="Application"
        title="Apply to Northhorr Technical College"
        description="Fill out the application form below to apply to Northhorr Technical College."
        image="https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=2000&q=80"
      />
      <ApplicationForm />
    </>
  );
}