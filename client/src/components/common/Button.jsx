export default function Button({ children, variant = 'primary', type = 'button', disabled, onClick, className = '', style = {}, ...props }) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      disabled={disabled}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}
