import './ToggleSwitch.css';

export default function ToggleSwitch({ active, onToggle, label }) {
  return (
    <div className="settings-item">
      {label && <span className="settings-label">{label}</span>}
      <div
        className={`toggle-switch ${active ? 'active' : ''}`}
        onClick={onToggle}
        role="switch"
        aria-checked={active}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
      />
    </div>
  );
}
