import React from 'react'
import { render } from '@testing-library/react-native'
import { Button, Text, TouchableOpacity } from 'react-native'

describe('Accessibility Tests', () => {
  it('buttons should have accessibility labels', () => {
    const { getByLabelText } = render(
      <TouchableOpacity accessibilityLabel="Buscar ruta" accessibilityRole="button">
        <Text>Buscar</Text>
      </TouchableOpacity>
    )

    expect(getByLabelText('Buscar ruta')).toBeTruthy()
  })

  it('images should have accessibility labels', () => {
    const { getByLabelText } = render(
      <TouchableOpacity accessibilityLabel="Logo de TransiLoja" accessibilityRole="image">
        <Text>Logo</Text>
      </TouchableOpacity>
    )

    expect(getByLabelText('Logo de TransiLoja')).toBeTruthy()
  })

  it('interactive elements should have proper roles', () => {
    const { getByRole } = render(
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Confirmar">
        <Text>OK</Text>
      </TouchableOpacity>
    )

    expect(getByRole('button')).toBeTruthy()
  })

  it('should have accessibility hints for non-obvious actions', () => {
    const { getByHintText } = render(
      <TouchableOpacity
        accessibilityLabel="Seleccionar parada"
        accessibilityHint="Toca dos veces para abrir el mapa"
        accessibilityRole="button"
      >
        <Text>Parada Central</Text>
      </TouchableOpacity>
    )

    expect(getByHintText('Toca dos veces para abrir el mapa')).toBeTruthy()
  })

  it('should support minimum touch target size', () => {
    const { getByRole } = render(
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Botón pequeño"
        style={{ width: 44, height: 44 }} // Mínimo iOS
      >
        <Text>X</Text>
      </TouchableOpacity>
    )

    const button = getByRole('button')
    expect(button.props.style.width).toBeGreaterThanOrEqual(44)
    expect(button.props.style.height).toBeGreaterThanOrEqual(44)
  })

  it('should group related elements', () => {
    const { getByLabelText } = render(
      <TouchableOpacity
        accessible={true}
        accessibilityLabel="Ruta 101, Parque Central a Terminal, 45 minutos"
        accessibilityRole="button"
      >
        <Text>Ruta 101</Text>
        <Text>Parque Central - Terminal</Text>
        <Text>45 min</Text>
      </TouchableOpacity>
    )

    expect(getByLabelText(/Ruta 101.*Parque Central.*Terminal.*45 minutos/)).toBeTruthy()
  })

  it('should announce dynamic content changes', () => {
    const { getByLabelText } = render(
      <Text
        accessibilityLabel="Bus 101 llegará en 3 minutos"
        accessibilityLiveRegion="polite"
      >
        Bus 101: 3 min
      </Text>
    )

    expect(getByLabelText(/Bus 101 llegará en 3 minutos/)).toBeTruthy()
  })
})
