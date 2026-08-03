import React from 'react';
import Button from './Button';
import Icon from './Icon';

/**
 * Reusable React Error Boundary Component
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a clean fallback UI.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-primary, #ffffff)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-bg, rgba(239, 68, 68, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              color: 'var(--danger, #ef4444)',
            }}
          >
            <Icon name="alert" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p
            style={{
              color: 'var(--text-secondary, #9ca3af)',
              maxWidth: '480px',
              marginBottom: '1.5rem',
            }}
          >
            An unexpected error occurred in the application. You can reload the page to restore functional state.
          </p>
          <Button variant="primary" onClick={this.handleReload}>
            Reload Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
