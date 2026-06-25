import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PmsAuthProvider } from './context/PmsAuthContext';
import { ToastProvider } from './components/ui/ToastContainer';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <PmsAuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </PmsAuthProvider>
    </BrowserRouter>
  );
}

export default App;
