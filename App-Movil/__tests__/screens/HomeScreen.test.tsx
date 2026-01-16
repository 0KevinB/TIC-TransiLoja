import React from 'react'
import { render, screen, waitFor } from '@testing-library/react-native'
import HomeScreen from '@/app/(tabs)/index'

// Mock del contexto de autenticación
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: '123', email: 'test@test.com' },
    loading: false,
  }),
}))

describe('HomeScreen', () => {
  it('renders home screen correctly', () => {
    render(<HomeScreen />)

    expect(screen.getByText(/TransiLoja|Inicio|Home/i)).toBeTruthy()
  })

  it('displays map component', () => {
    const { getByTestId } = render(<HomeScreen />)

    expect(getByTestId('map-container')).toBeTruthy()
  })

  it('shows search input for routes', () => {
    render(<HomeScreen />)

    expect(screen.getByPlaceholderText(/buscar|origen|destino/i)).toBeTruthy()
  })

  it('displays nearby stops', async () => {
    render(<HomeScreen />)

    await waitFor(() => {
      expect(screen.getByText(/paradas cercanas|nearby/i)).toBeTruthy()
    })
  })

  it('shows loading state initially', () => {
    const { getByTestId } = render(<HomeScreen />)

    expect(getByTestId('loading-indicator')).toBeTruthy()
  })
})
