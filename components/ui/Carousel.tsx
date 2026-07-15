"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";


interface CarouselItem {
  image: string;
  alt: string;
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlay? : boolean;
  showDots?: boolean;
  showArrows?: boolean;
  alt: string;
}

export function Carousel({
  items,
  autoPlay = true,
  showDots = true,
  showArrows = true,
  alt = "Gallery"
}: CarouselProps) {
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start"

    },
    autoPlay ? [Autoplay({ delay: 9000, stopOnInteraction: false })] : []
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  
  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);
  

  return (
    <div className="relative w-full max-w-5xl mx-auto">
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="flex-[0_0_100%] sm:flex-[0_0_75%] md:flex-[0_0_75%] lg:flex-[0_0_65%] xl:flex-[0_0_50%] px-2 sm:px-3"
          >
            <div className="group"> 
              <div className="
              relative
              w-full
              aspect-[4/3]
              rounded-3xl
              overflow-hidden
              shadow-xl
              transition-all 
              duration-400
              group-hover:shadow-2xl
              group-hover:scale-105
              "
              >
             <Image
              src={item.image}
              alt={item.alt}
              fill
              sizes="(max-width:760px) 100vw, 
              (max-width:1024px) 50vw,
              33vw"
              className="object-cover 
              transition 
              duration-700 
              group-hover:scale-110"
             />
             <div className="
             absolute 
             inset-0 
             bg-gradient-to-t
             from-black/60
             via-transparent
             to-transparent
             ">
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white font-semibold">{item.alt}</h3>
              </div>
            </div>
              </div>
             </div> 
          </div>
        ))}
        </div>
        
      </div>
      
      {showArrows && (
        <>
          <button 
            onClick={() => emblaApi?.scrollPrev()} 
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/90 hover:bg-white text-brand-dark shadow-lg transition flex items-center justify-center"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button 
            onClick={() => emblaApi?.scrollNext()} 
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/90 hover:bg-white text-brand-dark shadow-lg transition flex items-center justify-center"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}
      
      {showDots && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2.5 rounded-full transition-all ${
                selectedIndex === index 
                  ? "w-8 bg-brand-dark" 
                  : "w-2.5 bg-white/60 hover:bg-white"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
    