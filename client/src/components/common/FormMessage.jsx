export default function FormMessage({ message, isError = true }) {
  if (!message) return null;
  return (
    <p
      className={`form-message ${isError ? 'error' : 'success'}`}
      style={{ color: isError ? '#ff6b6b' : '#34d399' }}
    >
      {message}
    </p>
  );
}
