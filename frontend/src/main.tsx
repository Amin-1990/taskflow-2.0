import { render } from 'preact';
import { Toaster } from 'react-hot-toast';
import { App } from './app';
import { applyLayoutTheme, getStoredLayoutTheme } from './utils/layoutTheme';
import './index.css';

applyLayoutTheme(getStoredLayoutTheme());

render(
  <>
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '8px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: '500',
        },
        success: {
          style: {
            background: '#10b981',
            color: 'white',
          },
          icon: '✅',
        },
        error: {
          style: {
            background: '#ef4444',
            color: 'white',
          },
          icon: '❌',
        },
        loading: {
          style: {
            background: '#6b7280',
            color: 'white',
          },
          icon: '⏳',
        },
      }}
    />
    <App />
  </>,
  document.getElementById('app')!
);
