import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Calculator,
  ChartNoAxesCombined,
  ChevronRight,
  FlaskConical,
  LayoutDashboard,
  Radio,
  Upload,
  Waves,
} from 'lucide-react';
import { experiments } from '@/data/experiments';
import { Link, usePath } from '@/app/router';
export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const path = usePath();
  return (
    <div className={`sidebar-content ${collapsed ? 'is-collapsed' : ''}`}>
      <Link
        to="/"
        className="brand"
        onClick={onNavigate}
        aria-label="AM Studio dashboard"
      >
        <span className="brand-mark">
          <Activity size={25} />
        </span>
        <span className="brand-copy">
          <strong>
            AM Studio<span className="brand-dot">.</span>
          </strong>
          <small>Amplitude Modulation Laboratory</small>
        </span>
      </Link>
      <div className="workspace-label">
        <span className="tiny-square" /> ANALOG COMMUNICATIONS
      </div>
      <nav aria-label="Main navigation">
        <div className="nav-group">
          <p>OVERVIEW</p>
          <Link
            to="/"
            title="Dashboard"
            className={`nav-link ${path === '/' ? 'active' : ''}`}
            onClick={onNavigate}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            {path === '/' && <span className="active-dot" />}
          </Link>
        </div>
        <div className="nav-group">
          <p>
            EXPERIMENTS <span>04</span>
          </p>
          {experiments.map((e) => (
            <Link
              key={e.id}
              title={e.fullName}
              to={`/experiments/${e.id}`}
              className={`nav-link experiment-link ${path.endsWith(e.id) ? 'active' : ''}`}
              onClick={onNavigate}
            >
              <span className="nav-number">{e.number}</span>
              <span>
                <strong>{e.name}</strong>
                <small>{e.fullName}</small>
              </span>
              <ChevronRight size={13} className="nav-chevron" />
            </Link>
          ))}
        </div>
        <div className="nav-group">
          <p>ANALYSIS</p>
          {[
            {
              to: '/comparison',
              label: 'Modulation Comparison',
              icon: ChartNoAxesCombined,
            },
            { to: '/demodulation', label: 'Demodulation', icon: Waves },
            { to: '/theory', label: 'Theory & Equations', icon: BookOpen },
          ].map((n) => (
            <Link
              key={n.to}
              to={n.to}
              title={n.label}
              onClick={onNavigate}
              className={`nav-link ${path === n.to ? 'active' : ''}`}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
            </Link>
          ))}
        </div>
        <div className="nav-group">
          <p>TOOLS</p>
          {[
            { to: '/calculations', label: 'Calculations', icon: Calculator },
            { to: '/export', label: 'Export Data', icon: Upload },
          ].map((n) => (
            <Link
              key={n.to}
              to={n.to}
              title={n.label}
              onClick={onNavigate}
              className={`nav-link ${path === n.to ? 'active' : ''}`}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <div className="sidebar-bottom">
        <Link to="/theory" className="learning-note" onClick={onNavigate}>
          <span className="learning-icon">
            <FlaskConical size={18} />
          </span>
          <strong>A little theory. A lot of insight.</strong>
          <p>Get to know the signals behind the science.</p>
          <span>
            Explore the essentials <ArrowUpRight size={13} />
          </span>
        </Link>
        <div className="sidebar-version">
          <Radio size={15} />
          <span>
            AM Studio <b>v1.0</b>
          </span>
        </div>
        <div className="preview-status">
          <span /> Static UI Preview
        </div>
      </div>
    </div>
  );
}
