import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoWordmarkProps = {
  className?: string;
  centered?: boolean;
  hero?: boolean;
  lightSurface?: boolean;
  glow?: boolean;
  imageClassName?: string;
};

export function LogoWordmark({
  className,
  centered = false,
  hero = false,
  lightSurface = false,
  glow = false,
  imageClassName,
}: LogoWordmarkProps) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {glow && (
        <Image
          src="/EasyFlowLogo.png"
          alt=""
          aria-hidden
          fill
          sizes={hero ? "720px" : "320px"}
          quality={100}
          className={cn(
            "pointer-events-none object-contain opacity-40 blur-[8px] saturate-150",
            centered ? "origin-center object-center" : "origin-left object-left",
            hero ? "scale-[1.6]" : "scale-[1.24]",
            imageClassName
          )}
          priority
        />
      )}
      <Image
        src="/EasyFlowLogo.png"
        alt="EasyFlow"
        fill
        sizes={hero ? "720px" : "320px"}
        quality={100}
        className={cn(
          "object-contain",
          centered ? "origin-center object-center" : "origin-left object-left",
          hero ? "scale-[1.55]" : "scale-[1.2]",
          imageClassName,
          glow &&
            "[filter:drop-shadow(0_0_10px_rgba(34,211,238,0.18))_drop-shadow(0_0_22px_rgba(34,211,238,0.14))]",
          lightSurface &&
            "[filter:drop-shadow(0_0_0.6px_rgba(34,211,238,0.95))_drop-shadow(0_0_1.2px_rgba(34,211,238,0.82))_drop-shadow(0_0_2px_rgba(8,47,73,0.22))]"
        )}
        priority
      />
    </div>
  );
}
