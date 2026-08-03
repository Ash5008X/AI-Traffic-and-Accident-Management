export default function FormField({ label, id, name, type = 'text', value, onChange, placeholder, required, children }) {
  // If children are provided (e.g., select options), render select
  if (children) {
    return (
      <div className="field-wrap">
        {label && <label htmlFor={id}>{label}</label>}
        <select id={id} name={name} value={value} onChange={onChange} required={required}>
          {children}
        </select>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="field-wrap">
        {label && <label htmlFor={id}>{label}</label>}
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={3}
        />
      </div>
    );
  }

  return (
    <div className="field-wrap">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
