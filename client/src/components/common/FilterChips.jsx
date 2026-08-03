export default function FilterChips({ options, active, onChange }) {
  return (
    <div className="filter-bar">
      {options.map((opt) => (
        <button
          key={opt}
          className={`chip ${active === opt ? 'active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
