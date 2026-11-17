import { ChevronRight, PanelLeft, Play, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePath, Link } from '@/app/router';
import { getExperiment } from '@/data/experiments';
export function Topbar({ onToggle }: { onToggle: () => void }) {
  const path = usePath();
  const experiment = getExperiment(path.split('/')[2]);
  const label =
    experiment?.name ||
    {
      '/': 'Dashboard',
      '/comparison': 'Modulation Comparison',
      '/demodulation': 'Demodulation',
      '/theory': 'Theory & Equations',
      '/calculations': 'Calculations',
      '/export': 'Export Data',
    }[path] ||
    'Page not found';
  return (
    <header className="topbar">
      <div className="topbar-left">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={18} />
        </Button>
        <span className="breadcrumb">
          <Link to="/">Workspace</Link>
          <ChevronRight size={13} />
          {experiment && (
            <>
              <span>Experiments</span>
              <ChevronRight size={13} />
            </>
          )}
          <strong>{label}</strong>
        </span>
      </div>
      <div className="toolbar-actions">
        <span className="toolbar-preview">
          <span /> Static preview
        </span>
        {experiment && <span className="badge neutral">{experiment.name}</span>}
        <select aria-label="Simulation speed preview" defaultValue="1x">
          <option>0.25x</option>
          <option>0.5x</option>
          <option>1x</option>
          <option>2x</option>
        </select>
        <Button size="sm" disabled title="Simulation coming soon">
          <Play size={13} />
          Run<span className="coming-inline">Soon</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled
          title="Reset coming soon"
          aria-label="Reset coming soon"
        >
          <RotateCcw size={15} />
        </Button>
        <Button variant="outline" size="sm" disabled title="Saving coming soon">
          <Save size={14} />
          <span className="save-label">Save</span>
        </Button>
      </div>
    </header>
  );
}
