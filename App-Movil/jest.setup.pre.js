// Pre-setup para evitar problemas con jest-expo
// Este archivo se ejecuta antes de jest.setup.js

// Mock básico de TextEncoder/TextDecoder si no existen
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder
}

// Silenciar warnings de React 19
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && (
      args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Warning: useLayoutEffect') ||
      args[0].includes('Not implemented: HTMLFormElement.prototype.requestSubmit')
    )) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args) => {
    if (typeof args[0] === 'string' && (
      args[0].includes('Warning:') ||
      args[0].includes('Deprecat')
    )) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})
