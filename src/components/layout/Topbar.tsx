import { useState } from 'react';
import { ChevronRight, PanelLeft, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { usePath, Link } from '@/app/router';
import { getExperiment } from '@/data/experiments';
export function Topbar({ onToggle }: { onToggle: () => void }) {
  const path = usePath();
  const experiment = getExperiment(path.split('/')[2]);
  const [open, setOpen] = useState(false);
  const [contrast, setContrast] = useState(false);
  const label =
    experiment?.name ||
    {
      '/': 'Overview',
      '/experiments': 'Experiments',
      '/comparison': 'Comparison',
      '/demodulation': 'Demodulation',
      '/theory': 'Theory & equations',
      '/calculations': 'Calculations',
      '/export': 'Export data',
    }[path] ||
    'Page not found';
  return (
    <header className="topbar">
      <div className="topbar-left">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label="Toggle navigation"
        >
          <PanelLeft size={18} />
        </Button>
        <span className="breadcrumb">
          <Link to="/">Laboratory</Link>
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Display preferences"
        >
          <SlidersHorizontal size={17} />
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Display preferences"
        description="Appearance settings apply to this visit only."
      >
        <label className="preference-option">
          <input
            type="checkbox"
            checked={contrast}
            onChange={(e) => {
              setContrast(e.target.checked);
              document.documentElement.classList.toggle(
                'strong-grid',
                e.target.checked,
              );
            }}
          />{' '}
          Increase instrument grid contrast
        </label>
        <p>Motion follows your system’s reduced-motion preference.</p>
      </Dialog>
    </header>
  );
}
