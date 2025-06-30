import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;

  fallback?: ReactNode;

}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded border overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}