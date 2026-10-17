import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled app error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bgMain text-textMain flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center text-3xl mb-6">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h1 className="text-3xl font-black mb-2">Something went wrong</h1>
          <p className="text-textMuted max-w-md text-sm mb-6">
            An unexpected client error occurred. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-full bg-textMain text-bgMain font-bold text-sm hover:scale-105 transition-transform"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
