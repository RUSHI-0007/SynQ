"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CanvasRevealEffectProps {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
}

export const CanvasRevealEffect = ({
  animationSpeed = 0.4,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName = "",
  dotSize = 3,
  showGradient = true,
}: CanvasRevealEffectProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;

    canvas.width = width;
    canvas.height = height;

    class Dot {
      x: number;
      y: number;
      size: number;
      opacity: number;
      targetOpacity: number;
      speed: number;
      color: number[];

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = dotSize;
        this.opacity = 0;
        this.targetOpacity = opacities[Math.floor(Math.random() * opacities.length)] || 0.5;
        this.speed = (Math.random() * 0.02 + 0.01) * animationSpeed;
        this.color = colors[Math.floor(Math.random() * colors.length)] || [255, 255, 255];
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.opacity})`;
        ctx.fill();
      }

      update(time: number) {
        // Ping-pong opacity based on sine wave
        this.opacity = (Math.sin(time * this.speed + this.x) + 1) / 2 * this.targetOpacity;
        this.draw();
      }
    }

    const dots: Dot[] = [];
    const spacing = 20;

    for (let x = spacing / 2; x < width; x += spacing) {
      for (let y = spacing / 2; y < height; y += spacing) {
        dots.push(new Dot(x, y));
      }
    }

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      dots.forEach((dot) => dot.update(time * 0.1));
      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    const handleResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [animationSpeed, colors, opacities, dotSize]);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${containerClassName}`}>
      <motion.canvas
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        ref={canvasRef}
        className="w-full h-full absolute inset-0 z-0"
      />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black z-10 pointer-events-none opacity-50" />
      )}
    </div>
  );
};
