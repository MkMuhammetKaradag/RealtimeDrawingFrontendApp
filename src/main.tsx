// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store.ts';
import { setupInterceptors } from './services/service.ts';

const Loading = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '2rem',
      color: '#333',
    }}
  >
    Yükleniyor...
  </div>
);

setupInterceptors(store);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      {/* PersistGate, veriler localStorage'dan geri yüklenene kadar bir yüklenme ekranı gösterebilir. */}
      {/* loading={null} diyerek bekleme ekranını atlıyoruz. */}
      <PersistGate loading={<Loading />} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);
