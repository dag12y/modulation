import { createContext, useContext, useEffect, useState } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
const RouteContext = createContext('/');
export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const update = () => {
      setPath(window.location.hash.slice(1) || '/');
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return <RouteContext.Provider value={path}>{children}</RouteContext.Provider>;
}
export function usePath() {
  return useContext(RouteContext);
}
export function Link({
  to,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  return <a href={`#${to}`} {...props} />;
}
