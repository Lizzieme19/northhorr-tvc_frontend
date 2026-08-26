"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { galleryApi } from "@/lib/services";

const categories = ["All", "GENERAL", "EVENTS", "FACILITIES", "STUDENTS", "STAFF"] as const;

export default function GalleryClient() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await galleryApi.getAll();
      setGalleryItems(response.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    active === "All"
      ? galleryItems
      : galleryItems.filter((g) => g.category === active);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              active === c
                ? "bg-brand text-cream shadow"
                : "bg-white text-brand-dark border border-stone/15 hover:border-brand"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-stone">
          No images found in this category.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setLightbox(i)}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition"
            >
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-cream text-left translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition">
                <div className="text-xs uppercase tracking-wider text-gold">
                  {item.category}
                </div>
                <div className="font-medium">{item.title}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-brand-dark/95 backdrop-blur grid place-items-center p-6 cursor-zoom-out animate-fade-in"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            className="absolute top-6 right-6 h-10 w-10 rounded-full bg-cream/20 hover:bg-gold text-cream hover:text-brand-dark grid place-items-center"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="relative w-full max-w-5xl aspect-[3/2]">
            <Image
              src={filtered[lightbox].image_url}
              alt={filtered[lightbox].title}
              fill
              className="object-contain"
            />
          </div>
          <div className="mt-4 text-cream/90 text-center">
            {filtered[lightbox].title}
            {filtered[lightbox].description && (
              <p className="text-sm text-cream/70 mt-2">{filtered[lightbox].description}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
