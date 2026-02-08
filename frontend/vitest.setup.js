require('@testing-library/jest-dom');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Mock import.meta.env for Vite compatibility in Jest
globalThis.importMeta = { env: { VITE_API_URL: '', VITE_API_PROXY_TARGET: '' } };
Object.defineProperty(globalThis, 'import.meta', {
  value: { env: { VITE_API_URL: '', VITE_API_PROXY_TARGET: '' } },
  writable: true,
});

// Mock window.matchMedia for GSAP and other libraries
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = function () {
    return {
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
} 