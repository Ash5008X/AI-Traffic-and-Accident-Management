import Icon from './Icon';

export default function EmptyState({ icon = 'check_circle', message = 'Nothing to show.', style = {} }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', ...style }}>
      <Icon name={icon} size={32} style={{ marginBottom: 8 }} />
      <div>{message}</div>
    </div>
  );
}
