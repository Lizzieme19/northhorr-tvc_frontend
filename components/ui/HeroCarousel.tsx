"use client";

import { useEffect, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroSlide {
  image: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
};

interface HeroCarouselProps {
  slides: HeroSlide[];
};

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const autoplay = Autoplay({
    delay: 10000,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  });

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    duration: 40,
  },
  [autoplay]);

  const scrollPrev = useCallback(()=> emblaApi?.scrollPrev(), [emblaApi]);

  const scrollNext = useCallback(()=> emblaApi?.scrollNext(), [emblaApi]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);

    emblaApi.on("reInit", onInit);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onInit, onSelect]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  return (
    <section className="relative h-[50vh] overflow-hidden">

        {/*Slides */}
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">

            {slides.map((slide, index) => (
              <div key={index} className="relative flex-[0_0_100%] h-full">
                <Image 
                  src={slide.image} 
                  alt={slide.title}
                  fill
                  className="object-cover"
                />

                {/** Overlay */}
                <div className="absolute inset-0 bg-black/50"/>
                <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent"/>
                
                {/** Content */}
                <div className="relative z-20 mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6">

                  <div className="max-w-2xl text-white">
                    <span className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 text-gold">North Horr Technical and Vocational College</span>
                    <h1 className="mt-4 sm:mt-6 font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                      {slide.title}
                    </h1>

                    <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-white/90">
                      {slide.description}
                    </p>

                    <Link 
                      href={slide.buttonLink} 
                      className="mt-4 sm:mt-6 inline-flex rounded-full bg-gold text-black px-6 sm:px-8 py-3 sm:py-4 font-semibold transition hover:bg-gold-soft text-sm sm:text-base">
                        {slide.buttonText}
                    </Link>

                  </div>

                </div> 
                
              </div>
            ))}
          </div>
        </div>

        {/** Left - Hidden on mobile */}
        <button 
          onClick={scrollPrev}
          className="hidden sm:flex absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/90 shadow-xl transition hover:bg-white"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/** Right - Hidden on mobile */}
        <button 
          onClick={scrollNext}
          className="hidden sm:flex absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/90 shadow-xl transition hover:bg-white"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/** Carousel Indicators - Visible on mobile */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                selectedIndex === index ? 'bg-gold w-6' : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
    </section>
  )
    
}