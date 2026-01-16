import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { RouteCard } from '@/components/RouteCard'

describe('RouteCard Component', () => {
  const mockRoute = {
    id: '1',
    nombre: 'Ruta 101',
    numero: '101',
    color: '#FF0000',
    paradas: ['parada1', 'parada2', 'parada3'],
    descripcion: 'Ruta principal',
    activa: true,
    municipio_id: 'mun1',
    fecha_creacion: new Date(),
  }

  it('renders route information correctly', () => {
    render(<RouteCard route={mockRoute} />)

    expect(screen.getByText('Ruta 101')).toBeTruthy()
    expect(screen.getByText('101')).toBeTruthy()
  })

  it('displays route color indicator', () => {
    const { getByTestId } = render(<RouteCard route={mockRoute} />)

    const colorIndicator = getByTestId('route-color-indicator')
    expect(colorIndicator.props.style).toMatchObject({
      backgroundColor: '#FF0000',
    })
  })

  it('shows number of stops', () => {
    render(<RouteCard route={mockRoute} />)

    expect(screen.getByText(/3.*paradas/i)).toBeTruthy()
  })

  it('handles press event', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(<RouteCard route={mockRoute} onPress={onPress} />)

    const card = getByTestId('route-card')
    card.props.onPress()

    expect(onPress).toHaveBeenCalledWith(mockRoute)
  })

  it('displays inactive status', () => {
    const inactiveRoute = { ...mockRoute, activa: false }
    render(<RouteCard route={inactiveRoute} />)

    expect(screen.getByText(/inactiva/i)).toBeTruthy()
  })
})
