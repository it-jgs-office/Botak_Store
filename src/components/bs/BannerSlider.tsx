import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type BannerVariant = "full" | "compact";

const SLIDES = [
  {
    id: "topup",
    type: "image" as const,
    src: "/banner-botak.png",
    alt: "Top up kilat BotakStore",
  },
  {
    id: "joki",
    type: "joki" as const,
  },
];

const HEIGHTS: Record<BannerVariant, string> = {
  full: "aspect-[2167/726] min-h-[7.25rem] max-h-[32rem] sm:min-h-[12rem]",
  compact: "aspect-[2167/726] min-h-[7.25rem] max-h-[15rem] sm:min-h-[10rem]",
};

export function BannerSlider({ variant = "full" }: { variant?: BannerVariant }) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % SLIDES.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const showPrevious = () => {
    setActiveSlide((current) => (current - 1 + SLIDES.length) % SLIDES.length);
  };

  const showNext = () => {
    setActiveSlide((current) => (current + 1) % SLIDES.length);
  };

  return (
    <section
      className={`group relative isolate w-full overflow-hidden rounded-2xl border border-[#d8ad24]/60 bg-[#081126] shadow-[0_16px_40px_-24px_rgba(2,8,23,.85)] sm:rounded-[1.75rem] ${HEIGHTS[variant]}`}
      aria-label="Banner BotakStore"
      aria-roledescription="carousel"
    >
      <div
        className="flex h-full transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
      >
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className="h-full w-full shrink-0"
            aria-hidden={activeSlide !== index}
          >
            {slide.type === "image" ? (
              <div className="relative h-full w-full">
                <img
                  src={slide.src}
                  alt={slide.alt}
                  width={2167}
                  height={726}
                  className="block h-full w-full object-cover object-center"
                  fetchPriority={index === 0 ? "high" : "auto"}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020817]/20" />
              </div>
            ) : (
              <div className="relative flex h-full items-center overflow-hidden bg-[radial-gradient(circle_at_78%_42%,#284d92_0%,#10244a_32%,#071126_68%,#040a17_100%)] px-[8%] text-white">
                <div className="pointer-events-none absolute -bottom-28 -left-12 h-64 w-64 rounded-full bg-[#f4bd15]/25 blur-3xl" />
                <div className="pointer-events-none absolute right-[6%] top-0 h-px w-[38%] bg-gradient-to-r from-transparent via-[#ffd447]/80 to-transparent" />
                <div className="relative z-10 max-w-[56%]">
                  <p className="inline-flex rounded-full border border-[#ffd447]/35 bg-[#ffd447]/10 px-2 py-1 text-[clamp(.48rem,.85vw,.8rem)] font-black uppercase tracking-[.2em] text-[#ffd447] sm:px-3">
                    BotakStore Boost
                  </p>
                  <h2 className="mt-[3%] text-[clamp(1.05rem,3.5vw,3.75rem)] font-black leading-[.96] tracking-tight">
                    Joki Rank
                    <span className="block text-[#ffd447]">Mobile Legends</span>
                  </h2>
                  <p className="mt-[3%] max-w-xl text-[clamp(.56rem,1.25vw,1.15rem)] leading-relaxed text-white/75">
                    Push rank aman, proses transparan, dan dikerjakan player berpengalaman.
                  </p>
                </div>
                <div className="absolute inset-y-0 right-[5%] flex w-[38%] items-center justify-center">
                  <div className="absolute h-[72%] w-[72%] rounded-full bg-[#ffd447]/15 blur-2xl" />
                  <img
                    src="/rank-calculator/mythical-glory.png"
                    alt="Emblem Mythical Glory"
                    className="relative z-10 h-[72%] w-[72%] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,.45)]"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] ring-1 ring-inset ring-white/10" />
      <div className="pointer-events-none absolute inset-x-[10%] bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-[#ffd447]/90 to-transparent" />

      <button
        type="button"
        onClick={showPrevious}
        aria-label="Banner sebelumnya"
        className="absolute left-2 top-1/2 z-20 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#071126]/70 text-white shadow-lg backdrop-blur-md transition hover:border-[#ffd447]/80 hover:bg-[#ffd447] hover:text-[#071126] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd447] sm:left-5 sm:h-10 sm:w-10"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button
        type="button"
        onClick={showNext}
        aria-label="Banner berikutnya"
        className="absolute right-2 top-1/2 z-20 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#071126]/70 text-white shadow-lg backdrop-blur-md transition hover:border-[#ffd447]/80 hover:bg-[#ffd447] hover:text-[#071126] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd447] sm:right-5 sm:h-10 sm:w-10"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/10 bg-[#030917]/55 px-2 py-1.5 shadow-lg backdrop-blur-md sm:bottom-4 sm:gap-2 sm:px-3 sm:py-2">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveSlide(index)}
            aria-label={`Tampilkan banner ${index + 1}`}
            aria-current={activeSlide === index}
            className={`h-1.5 rounded-full transition-all sm:h-2 ${
              activeSlide === index
                ? "w-5 bg-[#ffd447] shadow-[0_0_10px_rgba(255,212,71,.75)] sm:w-7"
                : "w-1.5 bg-white/70 hover:bg-white sm:w-2"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
