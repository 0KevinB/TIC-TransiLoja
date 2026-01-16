import React from 'react'
import { render } from '@testing-library/react-native'
import { BusMarker } from '@/components/BusMarker'

describe('BusMarker Component', () => {
  const mockBus = {
    id: 'bus1',
    placa: 'ABC-1234',
    numero_interno: '101',
    ubicacion: {
      latitud: -3.99313,
      longitud: -79.20422,
    },
    ruta_actual: 'Ruta 101',
    estado: 'en_servicio',
  }

  it('renders bus marker with correct coordinates', () => {
    const { getByTestId } = render(<BusMarker bus={mockBus} />)

    const marker = getByTestId('bus-marker')
    expect(marker.props.coordinate).toEqual({
      latitude: -3.99313,
      longitude: -79.20422,
    })
  })

  it('displays bus number', () => {
    const { getByText } = render(<BusMarker bus={mockBus} />)

    expect(getByText('101')).toBeTruthy()
  })

  it('shows correct icon based on bus estado', () => {
    const { getByTestId } = render(<BusMarker bus={mockBus} />)

    const icon = getByTestId('bus-icon')
    expect(icon).toBeTruthy()
  })

  it('handles marker press', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(<BusMarker bus={mockBus} onPress={onPress} />)

    const marker = getByTestId('bus-marker')
    marker.props.onPress()

    expect(onPress).toHaveBeenCalledWith(mockBus)
  })
})
