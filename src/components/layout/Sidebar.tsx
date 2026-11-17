import {
  Activity,
  BookOpen,
  Calculator,
  ChartNoAxesCombined,
  FlaskConical,
  LayoutDashboard,
  Upload,
  Waves,
} from 'lucide-react';
import { Link, usePath } from '@/app/router';
export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const path = usePath();
  const items = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/experiments/dsb-fc', label: 'Experiments', icon: FlaskConical },
    { to: '/comparison', label: 'Comparison', icon: ChartNoAxesCombined },
    { to: '/theory', label: 'Theory & equations', icon: BookOpen },
    { to: '/demodulation', label: 'Demodulation', icon: Waves },
    { to: '/calculations', label: 'Calculations', icon: Calculator },
    { to: '/export', label: 'Export data', icon: Upload },
  ];
  return (
    <div className={`studio-rail ${collapsed ? 'compact-rail' : ''}`}>
      <Link
        to="/"
        className="studio-brand"
        onClick={onNavigate}
        aria-label="AM Studio dashboard"
      >
        <span>
          <Activity size={25} />
        </span>
        <strong>
          AM Studio<small>HYBRID INSTRUMENTS</small>
        </strong>
      </Link>
      <nav aria-label="Main navigation">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to.startsWith('/experiments')
            ? path.startsWith('/experiments')
            : path === to;
          return (
            <Link
              key={to}
              to={to}
              title={label}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              className={`rail-link ${active ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="rail-bottom">
        <span className="rail-version">02</span>
        <span className="rail-bottom-copy">
          A space for discovery.<small>Static educational edition</small>
        </span>
      </div>
    </div>
  );
}
