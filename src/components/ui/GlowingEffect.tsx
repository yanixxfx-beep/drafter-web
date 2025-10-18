"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { animate } from "motion/react";

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "purple" | "ai";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 0,
    spread = 20,
    variant = "purple",
    glow = false,
    className = "",
    movementDuration = 2,
    borderWidth = 1,
    disabled = false,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>(0);

    const handleMove = useCallback(
      (e?: MouseEvent | { x: number; y: number }) => {
        if (!containerRef.current) return;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;

          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = e?.x ?? lastPosition.current.x;
          const mouseY = e?.y ?? lastPosition.current.y;

          if (e) {
            lastPosition.current = { x: mouseX, y: mouseY };
          }

          const center = [left + width * 0.5, top + height * 0.5];
          const distanceFromCenter = Math.hypot(
            mouseX - center[0],
            mouseY - center[1]
          );
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

          if (distanceFromCenter < inactiveRadius) {
            element.style.setProperty("--active", "0");
            return;
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          element.style.setProperty("--active", isActive ? "1" : "0");

          if (!isActive) return;

          const currentAngle =
            parseFloat(element.style.getPropertyValue("--start")) || 0;
          let targetAngle =
            (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) /
              Math.PI +
            90;

          const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
          const newAngle = currentAngle + angleDiff;

          animate(currentAngle, newAngle, {
            duration: movementDuration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (value) => {
              element.style.setProperty("--start", String(value));
            },
          });
        });
      },
      [inactiveZone, proximity, movementDuration]
    );

    useEffect(() => {
      if (disabled) return;

      const handleScroll = () => handleMove();
      const handlePointerMove = (e: PointerEvent) => handleMove(e);

      window.addEventListener("scroll", handleScroll, { passive: true });
      document.body.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        window.removeEventListener("scroll", handleScroll);
        document.body.removeEventListener("pointermove", handlePointerMove);
      };
    }, [handleMove, disabled]);

    // Purple gradient for Drafter theme
    const purpleGradient = `
      radial-gradient(circle, #7C5CFF 10%, #7C5CFF00 20%),
      radial-gradient(circle at 40% 40%, #9D7FFF 5%, #9D7FFF00 15%),
      radial-gradient(circle at 60% 60%, #6A4FD9 10%, #6A4FD900 20%), 
      radial-gradient(circle at 40% 60%, #8B6FFF 10%, #8B6FFF00 20%),
      repeating-conic-gradient(
        from 236.84deg at 50% 50%,
        #7C5CFF 0%,
        #9D7FFF calc(25% / 5),
        #6A4FD9 calc(50% / 5), 
        #8B6FFF calc(75% / 5),
        #7C5CFF calc(100% / 5)
      )
    `;

    // AI gradient with purple, blue, orange
    const aiGradient = `
      radial-gradient(circle, #8B5CF6 10%, #8B5CF600 20%),
      radial-gradient(circle at 40% 40%, #3B82F6 5%, #3B82F600 15%),
      radial-gradient(circle at 60% 60%, #F97316 10%, #F9731600 20%), 
      radial-gradient(circle at 40% 60%, #A855F7 10%, #A855F700 20%),
      repeating-conic-gradient(
        from 236.84deg at 50% 50%,
        #8B5CF6 0%,
        #3B82F6 calc(25% / 5),
        #F97316 calc(50% / 5), 
        #A855F7 calc(75% / 5),
        #8B5CF6 calc(100% / 5)
      )
    `;

    const selectedGradient = variant === "ai" ? aiGradient : purpleGradient;

    return (
      <>
        <div
          className={`pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity ${
            glow && "opacity-100"
          } ${disabled && "!block"}`}
        />
        <div
          ref={containerRef}
          style={
            {
              "--blur": `${blur}px`,
              "--spread": spread,
              "--start": "0",
              "--active": "0",
              "--glowingeffect-border-width": `${borderWidth}px`,
              "--gradient": selectedGradient,
            } as React.CSSProperties
          }
          className={`pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity ${
            glow && "opacity-100"
          } ${blur > 0 && "blur-[var(--blur)]"} ${className} ${
            disabled && "!hidden"
          }`}
        >
          <div
            className="glow rounded-[inherit] after:content-[''] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))] after:[border:var(--glowingeffect-border-width)_solid_transparent] after:[background:var(--gradient)] after:[background-attachment:fixed] after:opacity-[var(--active)] after:transition-opacity after:duration-300 after:[mask-clip:padding-box,border-box] after:[mask-composite:intersect] after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
          />
        </div>
      </>
    );
  }
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };

