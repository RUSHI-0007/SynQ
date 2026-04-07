"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { CSSProperties } from "react";

interface BorderBeamProps {
  /**
   * The size of the beam in pixels. Controls both the element size
   * and the rounded radius of the offset-path rect.
   */
  size?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Width of the border in pixels */
  borderWidth?: number;
  /** Starting color of the beam gradient */
  colorFrom?: string;
  /** Ending color of the beam gradient */
  colorTo?: string;
  /** Custom Tailwind className — use `from-transparent via-color to-transparent` pattern */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Animate in reverse direction */
  reverse?: boolean;
  /** Starting offset distance percentage (0-100) */
  initialOffset?: number;
  /** Custom framer-motion transition override */
  transition?: Transition;
}

export function BorderBeam({
  size = 50,
  duration = 6,
  delay = 0,
  borderWidth = 1,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  className,
  style,
  reverse = false,
  initialOffset = 0,
  transition,
}: BorderBeamProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent] ![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]"
      style={
        {
          "--border-width": borderWidth,
        } as CSSProperties
      }
    >
      <motion.div
        className={cn(
          "absolute aspect-square bg-[linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]",
          className,
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round calc(var(--border-width) * 1px))`,
            "--color-from": colorFrom,
            "--color-to": colorTo,
            ...style,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{ offsetDistance: reverse ? ["100%", "0%"] : ["0%", "100%"] }}
        transition={
          transition ?? {
            repeat: Infinity,
            duration,
            delay: -delay,
            ease: "linear",
          }
        }
      />
    </div>
  );
}
