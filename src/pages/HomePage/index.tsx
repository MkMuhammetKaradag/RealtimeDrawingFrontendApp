// src/pages/HomePage/index.tsx

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { hello } from '../../services/auth.service';
import type { AppDispatch, RootState } from '../../store/store';

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  // Logout butonu için handler
  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // Hello butonu için handler
  const handleHello = async () => {
    try {
      const response = await hello();
      // Konsola yanıtı yazdır
      console.log('Hello from server:', response);
      alert('Hello from server: ' + JSON.stringify(response));
    } catch (error) {
      // Hata durumunda konsola yazdır
      console.error('Hello request failed:', error);
      alert('Hello request failed. See console for details.');
    }
  };

  return (
    <div>
      <h1>Home Page</h1>
      {/* Eğer kullanıcı bilgisi varsa, ismini göster */}
      {user && <p>Welcome, {user.username}!</p>}

      <div>
        <button onClick={handleHello}>Hello Server</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default HomePage;
