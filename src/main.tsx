// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store.ts';
import { setupInterceptors } from './services/service.ts';

// Bileşenler
import { ErrorBoundary } from './components/errorBoundary/ErrorBoundary';
import { Loading } from './components/loading/Loading';

// Servis interceptors'larını kur
setupInterceptors(store);

// Kök elementi bulma
const container = document.getElementById('root');

if (!container) {
  throw new Error('Kök element bulunamadı!');
}

const root = createRoot(container);

// Hata sınırı için fallback bileşeni
const ErrorFallback = () => (
  <div className="flex flex-col justify-center items-center h-screen p-8 text-center bg-gray-50">
    <h1 className="text-red-600 text-2xl font-bold mb-4">
      Uygulama Yüklenemedi
    </h1>
    <p className="text-gray-600 text-lg mb-8 max-w-md">
      Uygulama başlatılırken bir hata oluştu. Lütfen sayfayı yenileyin.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-6 py-3 bg-blue-600 text-white border-none rounded-md cursor-pointer text-base font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Sayfayı Yenile
    </button>
  </div>
);

try {
  root.render(
    <StrictMode>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Provider store={store}>
          <PersistGate
            loading={<Loading message="Uygulama hazırlanıyor..." />}
            persistor={persistor}
          >
            <App />
          </PersistGate>
        </Provider>
      </ErrorBoundary>
    </StrictMode>
  );
} catch (error) {
  console.error('Uygulama render edilemedi:', error);

  // Fallback render
  root.render(<ErrorFallback />);
}
