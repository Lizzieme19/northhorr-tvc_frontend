"use client";

import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { newsApi } from "@/lib/services";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  image_url?: string;
  is_featured: boolean;
  is_published: boolean;
  published_at?: string;
  created_at: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await newsApi.getById(params.id as string);
        setNewsItem(response.data.news);
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setError('Failed to load news');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchNews();
    }
  }, [params.id]);

  if (loading) {
    return (
      <>
        <PageHero
          eyebrow="News & Events"
          title="Loading..."
          description="Please wait while we load the content."
          image="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=2000&q=80"
        />
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">Loading...</div>
          </div>
        </section>
      </>
    );
  }

  if (error || !newsItem) {
    return (
      <>
        <PageHero
          eyebrow="News & Events"
          title="Content Not Found"
          description="The requested content could not be found."
          image="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=2000&q=80"
        />
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error || 'Content not found'}</p>
              <Link
                href="/news"
                className="inline-flex px-6 py-3 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition"
              >
                Back to News
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'event':
        return 'bg-terracotta text-cream';
      case 'announcement':
        return 'bg-brand text-cream';
      default:
        return 'bg-gold text-brand-dark';
    }
  };

  return (
    <>
      <PageHero
        eyebrow="News & Events"
        title={newsItem.title}
        description={newsItem.excerpt}
        image={newsItem.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=2000&q=80"}
      />

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg">
            <div className="p-8 lg:p-12">
              <div className="flex items-center gap-3 text-sm mb-6">
                <span className={`px-4 py-2 rounded-full font-semibold uppercase tracking-wider ${getCategoryColor(newsItem.category)}`}>
                  {newsItem.category}
                </span>
                {newsItem.published_at && (
                  <span className="text-stone">
                    {formatDate(newsItem.published_at)}
                  </span>
                )}
              </div>

              {newsItem.content && (
                <div className="prose prose-lg max-w-none text-stone leading-relaxed">
                  {newsItem.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              <div className="mt-12 pt-8 border-t border-stone/20">
                <Link
                  href="/news"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition"
                >
                  ← Back to News
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
