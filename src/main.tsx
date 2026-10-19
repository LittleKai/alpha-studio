import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { LanguageProvider } from './i18n/context';
import { ThemeProvider } from './theme/context';
import { AuthProvider } from './auth/context';
import { ConfirmProvider } from './components/ui/ConfirmDialog';
import './index.css';
// PHẢI đứng SAU './index.css'. Trên bản đang chạy, Play CDN tiêm stylesheet của
// nó vào <head> sau cả khối <style> trong index.html lẫn bundle CSS của Vite,
// nên utility của Tailwind thắng ở những chỗ trùng specificity. Đảo thứ tự hai
// dòng import này là đổi tầng cascade của toàn bộ app.
import './tailwind.css';

// React 19 hoists new metadata but does not replace tags saved by prerender.
document.head.querySelectorAll('title, meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"]').forEach(tag => tag.remove());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ConfirmProvider>
                <App />
              </ConfirmProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
