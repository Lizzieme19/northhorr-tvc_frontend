import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import GalleryClient from "@/components/pages/GalleryClient";

export const metadata: Metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Life and learning at NTVC."
        description="A glimpse into our campus, workshops, events and student life."
        image="https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=2000&q=80"
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <GalleryClient />
        </div>
      </section>
    </>
  );
}
