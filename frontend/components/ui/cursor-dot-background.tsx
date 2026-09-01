"use client";

import React, { useEffect, useRef } from "react";

export function CursorDotBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mutable refs for tracking cursor state without React re-renders
  const mouse = useRef({ x: -1000, y: -1000 });
  const interpolatedMouse = useRef({ x: -1000, y: -1000 });
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Configuration
    const dotSpacing = 14; // Distance between dots
    const baseRadius = 1;
    const baseOpacity = 0.15;
    
    // Interaction configuration
    const interactionRadius = 180;
    const maxExtraRadius = 1.2;
    const maxExtraOpacity = 0.5;
    const lerpFactor = 0.15;

    // Grid storage
    let dots: { x: number; y: number }[] = [];
    let width = 0;
    let height = 0;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    const resize = () => {
      // Use devicePixelRatio for high-DPI displays
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      
      // Calculate how many dots fit
      const cols = Math.floor(width / dotSpacing) + 1;
      const rows = Math.floor(height / dotSpacing) + 1;
      
      // Center the grid
      const offsetX = (width - (cols - 1) * dotSpacing) / 2;
      const offsetY = (height - (rows - 1) * dotSpacing) / 2;

      dots = [];
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dots.push({
            x: offsetX + i * dotSpacing,
            y: offsetY + j * dotSpacing,
          });
        }
      }
      
      // If we're not animating, we need to manually redraw on resize
      if (isReducedMotion) {
        drawStatic();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouse.current = { x: -1000, y: -1000 };
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      
      const cx = width / 2;
      const cy = height / 2;
      const maxDist = Math.max(cx, cy) * 1.2; // Adjust for vignette spread

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        // Vignette calculation
        const dxCenter = dot.x - cx;
        const dyCenter = dot.y - cy;
        const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
        const vignetteProgress = Math.min(distCenter / maxDist, 1);
        const vignetteMultiplier = 1 - Math.pow(vignetteProgress, 2.5); // Smooth falloff

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity * vignetteMultiplier})`;
        ctx.fill();
      }
    };

    const render = () => {
      if (isReducedMotion) {
        drawStatic();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Lerp the mouse position for smoothness
      interpolatedMouse.current.x += (mouse.current.x - interpolatedMouse.current.x) * lerpFactor;
      interpolatedMouse.current.y += (mouse.current.y - interpolatedMouse.current.y) * lerpFactor;

      const ix = interpolatedMouse.current.x;
      const iy = interpolatedMouse.current.y;
      
      const cx = width / 2;
      const cy = height / 2;
      const maxDist = Math.max(cx, cy) * 1.2; // Adjust for vignette spread

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        // Vignette calculation
        const dxCenter = dot.x - cx;
        const dyCenter = dot.y - cy;
        const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
        const vignetteProgress = Math.min(distCenter / maxDist, 1);
        const vignetteMultiplier = 1 - Math.pow(vignetteProgress, 2.5);

        // Calculate distance from interpolated cursor to dot
        const dx = dot.x - ix;
        const dy = dot.y - iy;
        const distSq = dx * dx + dy * dy;
        const interactionRadiusSq = interactionRadius * interactionRadius;

        let radius = baseRadius;
        let opacity = baseOpacity * vignetteMultiplier;
        let drawX = dot.x;
        let drawY = dot.y;

        if (distSq < interactionRadiusSq) {
          const dist = Math.sqrt(distSq);
          // Normalized value between 0 and 1, where 1 is exactly at the cursor
          const intensity = 1 - (dist / interactionRadius);
          
          // Easing function for smoother falloff
          const easeIntensity = intensity * intensity * (3 - 2 * intensity); // Smoothstep

          radius = baseRadius + (maxExtraRadius * easeIntensity);
          
          // Add interaction opacity on top of vignette, but capped
          const targetInteractionOpacity = baseOpacity + (maxExtraOpacity * easeIntensity);
          opacity = Math.max(opacity, targetInteractionOpacity * (0.2 + 0.8 * vignetteMultiplier));
          
          // Very subtle displacement toward the cursor
          const displacement = 2 * easeIntensity;
          if (dist > 0) {
            drawX -= (dx / dist) * displacement;
            drawY -= (dy / dist) * displacement;
          }
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    // Initialization
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    
    // Start loop
    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      mediaQuery.removeEventListener("change", handleMotionChange);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: "100vw", height: "100vh" }}
      aria-hidden="true"
    />
  );
}
