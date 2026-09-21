import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { auth, db } from './firebase'; // Ensure firebase is exported like this

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider auth={auth} db={db}>
      <DataProvider db={db}>
        <App />
      </DataProvider>
    </AuthProvider>
  </StrictMode>,
);
