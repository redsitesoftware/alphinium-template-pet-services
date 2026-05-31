import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.setAttribute('id', 'pawfect-web-fixes');
  style.textContent = `
    html, body {
      min-height: 100%;
      background: #FFF7ED;
      overflow-y: auto;
    }
    #root {
      min-height: 100vh;
    }
    * {
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);
}

registerRootComponent(App);
