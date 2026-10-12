export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'is-active' : ''}
          onClick={() => onChange(o.value)}
        >
          <span className="segmented__icon">{o.icon}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

export function Toasts({ items }) {
  return (
    <div className="toasts">
      {items.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
