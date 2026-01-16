import { renderHook, waitFor } from '@testing-library/react'
import { useAuth, AuthProvider } from '@/lib/auth-context'
import { onAuthStateChanged } from 'firebase/auth'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize and provide auth context', async () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useAuth(), { wrapper })

    // 1. Disparar el timeout inicial de 1000ms
    await jest.advanceTimersByTimeAsync(1000)

    // 2. Esperar a que initAuth (async) se ejecute y llame a onAuthStateChanged
    // onAuthStateChanged usa setTimeout(..., 0), así que avanzamos un poco más
    await jest.advanceTimersByTimeAsync(100)

    jest.useRealTimers()

    // Esperar a que termine la carga inicial
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 5000 })

    // Verificar que el usuario es null inicialmente
    expect(result.current.user).toBeNull()
  })

  it('should provide auth methods', async () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useAuth(), { wrapper })
    await jest.advanceTimersByTimeAsync(1100)
    jest.useRealTimers()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verificar que los métodos existen
    expect(result.current.signIn).toBeDefined()
    expect(typeof result.current.signIn).toBe('function')

    expect(result.current.signUp).toBeDefined()
    expect(typeof result.current.signUp).toBe('function')

    expect(result.current.logout).toBeDefined()
    expect(typeof result.current.logout).toBe('function')
  })

  it('should have firebaseUser property', async () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useAuth(), { wrapper })
    await jest.advanceTimersByTimeAsync(1100)
    jest.useRealTimers()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // FirebaseUser debe ser null inicialmente
    expect(result.current.firebaseUser).toBeNull()
  })

  it('should call onAuthStateChanged on mount', async () => {
    jest.useFakeTimers()
    renderHook(() => useAuth(), { wrapper })

    // 1. Disparar el timeout inicial de 1000ms
    await jest.advanceTimersByTimeAsync(1000)

    jest.useRealTimers()

    // Verificar que se llamó onAuthStateChanged
    await waitFor(() => {
      expect(onAuthStateChanged).toHaveBeenCalled()
    })
  })
})
