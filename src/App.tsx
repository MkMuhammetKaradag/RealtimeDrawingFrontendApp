import { BrowserRouter } from 'react-router-dom';
import Router from './router';
import './index.css';

// Ana uygulama bileşeni
const App = () => {
  return (
    <BrowserRouter>
      <Router></Router>
    </BrowserRouter>
  );
};

export default App;
