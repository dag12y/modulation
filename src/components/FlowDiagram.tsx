import {
  ArrowRight,
  AudioLines,
  Radio,
  SlidersHorizontal,
  Waves,
} from 'lucide-react';
export function FlowDiagram({
  demodulation = false,
}: {
  demodulation?: boolean;
}) {
  const steps = demodulation
    ? [
        { name: 'Received Signal', detail: 'Modulated input', icon: Radio },
        {
          name: 'Demodulator',
          detail: 'Recover the baseband',
          icon: SlidersHorizontal,
        },
        {
          name: 'Low-Pass Filter',
          detail: 'Remove high frequencies',
          icon: AudioLines,
        },
        {
          name: 'Recovered Message',
          detail: 'Original information',
          icon: Waves,
        },
      ]
    : [
        {
          name: 'Message Signal',
          detail: 'The information · m(t)',
          icon: Waves,
        },
        {
          name: 'Modulator',
          detail: 'Combine with a carrier',
          icon: SlidersHorizontal,
        },
        {
          name: 'Modulated Signal',
          detail: 'The encoded signal · s(t)',
          icon: AudioLines,
        },
        { name: 'Transmission', detail: 'Ready for the channel', icon: Radio },
      ];
  return (
    <div className="flow-diagram">
      {steps.map((s, i) => (
        <div className="flow-step" key={s.name}>
          <div className={`flow-icon ${i === 1 ? 'lime' : ''}`}>
            <s.icon size={21} />
          </div>
          <div>
            <strong>{s.name}</strong>
            <small>{s.detail}</small>
          </div>
          {i < 3 && <ArrowRight className="flow-arrow" size={17} />}
        </div>
      ))}
    </div>
  );
}
