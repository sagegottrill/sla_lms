import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyRouteSeo } from "@/lib/seo";

/**
 * Keeps `<title>`, meta description, canonical and social tags in sync with the
 * current route. Mounted once inside the router (see App.tsx) so no individual
 * page has to remember to do it.
 *
 * Renders nothing.
 */
export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    applyRouteSeo(pathname);
  }, [pathname]);

  return null;
}
