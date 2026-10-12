import { MinusIcon, PlusIcon } from './Icons.jsx';
import { haptic } from '../telegram.js';

export default function Stepper({ value, onChange, min = 0, size = 'md' }) {
  const change = (next) => {
    haptic.tap();
    onChange(Math.max(min, Math.min(50, next)));
  };
  return (
    <div className={`stepper stepper--${size}`} onClick={(e) => e.stopPropagation()}>
      <button type="button" aria-label="Kamaytirish" onClick={() => change(value - 1)} disabled={value <= min}>
        <MinusIcon width={16} height={16} />
      </button>
      <span>{value}</span>
      <button type="button" aria-label="Ko'paytirish" onClick={() => change(value + 1)} disabled={value >= 50}>
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  );
}
