import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {AuthProvider} from './contexts/AuthContext.tsx';
import {initAnalytics} from './lib/analytics';

// Render 前掛 GA。沒設 VITE_GA_MEASUREMENT_ID 的環境（本機開發、預覽部署）
// 這行是 no-op。
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
