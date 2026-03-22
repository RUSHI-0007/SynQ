'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { NavBar } from '@/components/landing/NavBar';
import { HeroSection } from '@/components/landing/HeroSection';
import { PlatformSection } from '@/components/landing/PlatformSection';
import { BentoSection } from '@/components/landing/BentoSection';
import { OrbitalSection } from '@/components/landing/OrbitalSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';

const SignInPage = dynamic(
  () => import('@/components/ui/sign-in-flow-1').then(m => m.SignInPage),
  { ssr: false }
);

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const handleCtaClick = () => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    } else {
      setIsLoginOpen(true);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Fade-in animations (AOS)
    gsap.utils.toArray('.aos').forEach((el: any) => {
      gsap.fromTo(el,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" }
        }
      );
    });

    // Container Scroll Animation for Hero Mockup
    const ht = document.getElementById("hero-scroll-container");
    const hi = document.getElementById("hero-scroll-inner");
    if (ht && hi) {
      gsap.to(hi, {
        scale: 1,
        borderRadius: "0px",
        scrollTrigger: {
          trigger: ht,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          pin: true
        }
      });
    }

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t: any) => t.kill());
    };
  }, []);

  return (
    <div className="bg-[#030303] min-h-screen w-full overflow-x-hidden text-white font-sans selection:bg-indigo-500/30">
      {/* Background fixed elements */}
      <div id="stars-global" className="fixed inset-0 pointer-events-none z-0">
        {[...Array(60)].map((_, i) => {
          const x = ((i * 137) % 100).toFixed(0) + '%';
          const y = ((i * 93) % 100).toFixed(0) + '%';
          const size = ((i % 2) + 1) + 'px';
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white opacity-40"
              style={{ left: x, top: y, width: size, height: size }}
            />
          );
        })}
      </div>

      <NavBar onLoginClick={() => setIsLoginOpen(true)} />
      <HeroSection onCtaClick={handleCtaClick} />
      <PlatformSection />
      <BentoSection />
      <OrbitalSection />
      <CTASection onCtaClick={handleCtaClick} />
      <Footer />
      {isLoginOpen && <SignInPage onClose={() => setIsLoginOpen(false)} />}
    </div>
  );
}
