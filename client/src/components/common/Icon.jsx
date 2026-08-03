import './Icon.css';

export default function Icon({ name, size, fill, className = '', style = {}, ...props }) {
  const iconStyle = { ...style };
  if (size) iconStyle.fontSize = `${size}px`;
  
  const variationSettings = fill 
    ? `'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' ${size || 24}`
    : undefined;
  if (variationSettings) iconStyle.fontVariationSettings = variationSettings;

  return (
    <span 
      className={`material-symbols-outlined ${className}`}
      style={iconStyle}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
}
