import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { departments } from "@/lib/data";
import { CoursesContent } from "./CoursesContent";

export const metadata: Metadata = { title: "Courses & Programs" };

export default function CoursesPage() {
  const totalCourses = departments.reduce((s, d) => s + d.courses.length, 0);

  return (
    <>
      <PageHero
        eyebrow="Courses & Programs"
        title="Find your path. Master a trade. Build your future."
        description={`Explore ${totalCourses}+ accredited TVET courses across ${departments.length} departments. Levels 3, 4, 5 and 6 — designed to make you industry-ready.`}
        image="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=2000&q=80"
      />

      <CoursesContent />
    </>
  );
}
