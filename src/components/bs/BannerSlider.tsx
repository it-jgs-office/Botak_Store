import { useState } from "react";

type BannerVariant = "full" | "compact";

const SLIDES = [
  { src: "/banner-botak.jpg", alt: "Banner BotakStore", position: "20%" },
  { src: "/banner-botak.jpg", alt: "Banner BotakStore", position: "50%" },
  { src: "/banner-botak.jpg", alt: "Banner BotakStore", position: "80%" },
];

const SIZES: Record<
  BannerVariant,
  { section: string; center: string; left: string; right: string; button: string }
> = {
  full: {
    section: "h-[clamp(19rem,37vw,38rem)]",
    center: "z-20 w-[86vw] -translate-x-1/2 -translate-y-1/2 opacity-100 shadow-[0_24px_70px_rgba(0,0,0,.55)] sm:w-[min(55vw,920px)]",
    left: "z-10 w-[65vw] -translate-x-[112%] -translate-y-1/2 opacity-55 brightness-75 sm:w-[min(40vw,650px)] sm:-translate-x-[125%]",
    right: "z-10 w-[65vw] translate-x-[12%] -translate-y-1/2 opacity-55 brightness-75 sm:w-[min(40vw,650px)] sm:translate-x-[25%]",
    button: "h-14 w-10 text-lg sm:h-[116px] sm:w-12",
  },
  compact: {
    section: "h-[clamp(9rem,15vw,15rem)]",
    center: "z-20 w-[70vw] -translate-x-1/2 -translate-y-1/2 opacity-100 shadow-[0_16px_44px_rgba(0,0,0,.5)] sm:w-[min(42vw,620px)]",
    left: "z-10 w-[48vw] -translate-x-[110%] -translate-y-1/2 opacity-55 brightness-75 sm:w-[min(28vw,400px)] sm:-translate-x-[122%]",
    right: "z-10 w-[48vw] translate-x-[10%] -translate-y-1/2 opacity-55 brightness-75 sm:w-[min(28vw,400px)] sm:translate-x-[22%]",
    button: "h-10 w-8 text-base sm:h-16 sm:w-10",
  },
};

export function BannerSlider({ variant = "full" }: { variant?: BannerVariant }) {
  const [active, setActive] = useState(1);
  const slides = SLIDES;
  const size = SIZES[variant];

  const move = (direction: -1 | 1) => {
    setActive((current) => (current + direction + slides.length) % slides.length);
  };

  return (
    <section
      className={`relative isolate w-full overflow-hidden bg-[#ffd84d] ${size.section}`}
      aria-label="Banner BotakStore"
      aria-roledescription="carousel"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, #fff2b5 0%, #ffd84d 68%, #efbd24 100%), linear-gradient(145deg, transparent 0 10%, #e9b91f 10.1% 14%, transparent 14.1%), linear-gradient(325deg, transparent 0 8%, #e9b91f 8.1% 12%, transparent 12.1%)",
        }}
      />

      {slides.map((slide, index) => {
        const relative = (index - active + slides.length) % slides.length;
        const position = relative === 0 ? "center" : relative === 1 ? "right" : "left";
        return (
          <div
            key={`${slide.position}-${index}`}
            className={`absolute left-1/2 top-1/2 aspect-[1024/571] overflow-hidden rounded-2xl transition-[transform,opacity,filter] duration-500 ease-out sm:rounded-[22px] ${
              position === "center"
                ? size.center
                : position === "left"
                  ? size.left
                  : size.right
            }`}
            aria-hidden={position !== "center"}
          >
            <img
              src={slide.src}
              alt={position === "center" ? slide.alt : ""}
              width={1024}
              height={571}
              className="block h-full w-full object-cover"
              style={{ objectPosition: `${slide.position} center` }}
              fetchPriority={position === "center" ? "high" : "auto"}
            />
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => move(-1)}
        aria-label="Banner sebelumnya"
        className={`absolute left-[max(1rem,calc((100%-80rem)/2+1rem))] top-1/2 z-30 flex -translate-y-1/2 items-center justify-center rounded-xl bg-[#252525] font-bold text-[#ffd84d] shadow-lg transition hover:bg-black ${size.button}`}
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        aria-label="Banner berikutnya"
        className={`absolute right-[max(1rem,calc((100%-80rem)/2+1rem))] top-1/2 z-30 flex -translate-y-1/2 items-center justify-center rounded-xl bg-[#252525] font-bold text-[#ffd84d] shadow-lg transition hover:bg-black ${size.button}`}
      >
        ›
      </button>
    </section>
  );
}
