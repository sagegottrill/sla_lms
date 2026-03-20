import { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * SmoothScroll — wraps the app with Lenis for silky inertia scrolling.
 * Provides a "rolling" scroll feel similar to premium sites.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,        // scroll duration (higher = smoother)
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // ease-out expo
            touchMultiplier: 2,   // touch device speed
            infinite: false,
        });

        lenisRef.current = lenis;

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
}
