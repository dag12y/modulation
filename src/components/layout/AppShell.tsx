import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Dialog } from '@/components/ui/dialog';
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = () => {
    if (window.matchMedia('(max-width: 900px)').matches) setMobileOpen(true);
    else setCollapsed((v) => !v);
  };
  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="desktop-sidebar">
        <Sidebar collapsed={collapsed} />
      </aside>
      <Dialog
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        title="AM Studio navigation"
        description="Choose an experiment or reference page."
        className="mobile-drawer"
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Dialog>
      <div className="app-body">
        <Topbar onToggle={toggle} />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="page-footer">
          <span>
            AM STUDIO V2 <span className="footer-divider">/</span> HYBRID
            INSTRUMENT STUDIO
          </span>
          <span>
            Learn the theory. See the signal.
            <span className="footer-dot" />
          </span>
        </footer>
      </div>
    </div>
  );
}
