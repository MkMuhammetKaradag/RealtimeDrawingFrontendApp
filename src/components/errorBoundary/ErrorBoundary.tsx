// src/components/errorBoundary/ErrorBoundary.tsx
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uygulama hatası:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col justify-center items-center h-screen p-8 text-center bg-gray-50">
            <h1 className="text-red-600 text-2xl font-bold mb-4">
              Bir Hata Oluştu
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
            </p>

            {/* Development'da hata detaylarını göster */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg text-left max-w-2xl">
                <p className="text-red-800 text-sm font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              Sayfayı Yenile
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
