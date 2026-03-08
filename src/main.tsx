import { useEffect } from 'react';

// 在你的主组件内添加
useEffect(() => {
  // 只在安卓手机上触发下载
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    const timer = setTimeout(() => {
      const link = document.createElement('a');
      link.href = '/suili.apk'; // 指向你刚才放进 public 的文件
      link.download = '随礼账本.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1500); // 进页面 1.5 秒后弹出

    return () => clearTimeout(timer);
  }
}, []);
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
