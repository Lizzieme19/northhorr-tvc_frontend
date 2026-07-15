"use client";

import Image from "next/image";
import Link from "next/link";
import { departments } from "@/lib/data";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function CoursesContent() {
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
    new Set(departments.map(d => d.slug))
  );
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const levels = ['all', 'Level 3', 'Level 4', 'Level 5', 'Level 6'];

  const filterCoursesByLevel = (courses: any[], level: string) => {
    if (level === 'all') return courses;
    return courses.filter(course => 
      course.levels.includes(level)
    );
  };

  const filterCoursesBySearch = (courses: any[], query: string) => {
    if (!query.trim()) return courses;
    const lowerQuery = query.toLowerCase();
    return courses.filter(course => 
      course.name.toLowerCase().includes(lowerQuery)
    );
  };

  const getFilteredCourses = (courses: any[]) => {
    let filtered = filterCoursesByLevel(courses, selectedLevel);
    filtered = filterCoursesBySearch(filtered, searchQuery);
    return filtered;
  };

  const toggleDepartment = (slug: string) => {
    setExpandedDepartments(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedDepartments(new Set(departments.map(d => d.slug)));
  const collapseAll = () => setExpandedDepartments(new Set());

  const totalCourses = departments.reduce((s, d) => s + d.courses.length, 0);

  return (
    <>
      {/* Filters */}
      <section className="sticky top-[64px] lg:top-[88px] z-30 bg-cream/95 backdrop-blur border-b border-stone/15">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 rounded-lg border border-stone/15 bg-white text-brand-dark placeholder-stone/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone/400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={expandAll}
                  className="px-3 py-2 text-sm font-medium text-brand-dark bg-white border border-stone/15 rounded-lg hover:bg-brand hover:text-cream transition"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-2 text-sm font-medium text-brand-dark bg-white border border-stone/15 rounded-lg hover:bg-brand hover:text-cream transition"
                >
                  Collapse All
                </button>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto">
                {departments.map((d) => (
                  <a
                    key={d.slug}
                    href={`#${d.slug}`}
                    className="px-4 py-2 rounded-full text-sm font-medium text-brand-dark bg-white border border-stone/15 hover:bg-brand hover:text-cream hover:border-brand transition whitespace-nowrap"
                  >
                    {d.icon} {d.name}
                  </a>
                ))}
              </div>
              <div className="flex gap-2 shrink-0">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                      selectedLevel === level
                        ? 'bg-brand text-cream'
                        : 'bg-white text-brand-dark border border-stone/15 hover:bg-brand/10'
                    }`}
                  >
                    {level === 'all' ? 'All Levels' : level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 space-y-24">
          {departments.map((d, idx) => {
            const isExpanded = expandedDepartments.has(d.slug);
            return (
            <article
              key={d.slug}
              id={d.slug}
              className="scroll-mt-40"
            >
              <div className="grid lg:grid-cols-12 gap-10">
                <header className="lg:col-span-4 lg:sticky lg:top-44 lg:self-start">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                    <Image src={d.image} alt={d.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 to-transparent" />
                    <div className="absolute top-4 left-4 h-14 w-14 rounded-xl bg-cream grid place-items-center text-3xl shadow-lg">
                      {d.icon}
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-terracotta text-xs font-semibold uppercase tracking-widest">
                          Department {String(idx + 1).padStart(2, "0")}
                        </span>
                        <h2 className="mt-3 font-display text-2xl text-brand-dark">
                          {d.name}
                        </h2>
                        <p className="mt-3 text-stone leading-relaxed">{d.tagline}</p>
                      </div>
                      <button
                        onClick={() => toggleDepartment(d.slug)}
                        className="shrink-0 h-10 w-10 rounded-full bg-brand/10 hover:bg-brand/20 flex items-center justify-center text-brand transition"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                    <Link
                      href={`/courses/${d.slug}`}
                      className="inline-block items-center gap-2 mt-5 text-brand font-semibold hover:text-terracotta transition"
                    >
                      View department page →
                    </Link>
                  </div>
                </header>

                <div className={`lg:col-span-8 transition-all duration-300 ${
                  isExpanded ? 'opacity-100 max-h-none' : 'opacity-0 max-h-0 overflow-hidden'
                }`}>
                  <div className="mb-6">
                    <h3 className="font-display text-xl text-brand-dark">
                      Available Programs ({d.courses.length})
                    </h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {getFilteredCourses(d.courses).map((c) => (
                    <div
                      key={c.name}
                      className="group p-6 bg-white rounded-2xl border border-stone/15 hover:border-brand/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display font-semibold text-lg text-brand-dark group-hover:text-brand transition-colors">
                          {c.name}
                        </h3>
                        <div className="h-10 w-10 rounded-xl bg-brand/5 group-hover:bg-brand/10 flex items-center justify-center text-xl shrink-0 transition-colors">
                          📘
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {c.levels.split(",").map((l: string) => (
                          <span
                            key={l}
                            className="text-xs px-2.5 py-1 rounded-full bg-cream-deep text-brand font-medium border border-brand/10"
                          >
                            {l.trim()}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 pt-4 border-t border-stone/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm text-stone">Full-time</span>
                        </div>
                        <Link
                          href={`/courses/${d.slug}`}
                          className="text-sm font-semibold text-terracotta hover:text-brand transition-colors flex items-center gap-1 group-hover:gap-2"
                        >
                          Enquire <span className="transition-transform group-hover:translate-x-1">→</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {getFilteredCourses(d.courses).length === 0 && (
                    <div className="col-span-2 text-center py-8 text-stone">
                      No courses match your filters
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      </section>

      <section className="py-20 bg-cream-deep">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl text-brand-dark">
            Not sure which course to pick?
          </h2>
          <p className="mt-4 text-stone">
            Our admissions team is happy to walk you through the right path
            for your goals and qualifications.
          </p>
          <Link
            href="/contact"
            className="inline-block mt-6 px-7 py-3.5 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition shadow"
          >
            Talk to Admissions →
          </Link>
        </div>
      </section>
    </>
  );
}
