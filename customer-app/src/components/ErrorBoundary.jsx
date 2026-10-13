import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#64748b', maxWidth: '460px', marginBottom: '1.5rem' }}>
            An unexpected error occurred while loading this page. Please try refreshing.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#a855f7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
