export default function Badge({ children, variant = 'default', className = '', style = {} }) {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {children}
    </span>
  );
}
