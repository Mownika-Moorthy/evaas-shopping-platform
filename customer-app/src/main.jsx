import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const DEFAULT_GOOGLE_CLIENT_ID = '540193116641-mehmgfkjb7lf9q571m0mboi2pev0c4rf.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
