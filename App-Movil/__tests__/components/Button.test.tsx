/**
 * Tests de Funcionalidad - Componente Button
 *
 * Tests básicos de funcionalidad para componentes de UI
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';

// Componente Button básico para testing
const Button = ({
  title,
  onPress,
  disabled = false,
  testID,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) => (
  <TouchableOpacity onPress={onPress} disabled={disabled} testID={testID}>
    <Text>{title}</Text>
  </TouchableOpacity>
);

describe('Button Component - Funcionalidad', () => {
  it('debe renderizar correctamente', () => {
    const { getByText } = render(<Button title="Click Me" onPress={() => {}} />);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('debe ejecutar onPress cuando se hace click', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={onPressMock} />);

    const button = getByText('Click Me');
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('no debe ejecutar onPress cuando está deshabilitado', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <Button title="Click Me" onPress={onPressMock} disabled={true} testID="btn" />
    );

    const button = getByTestId('btn');
    fireEvent.press(button);

    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('debe ser accesible (testID)', () => {
    const { getByTestId } = render(
      <Button title="Click Me" onPress={() => {}} testID="my-button" />
    );

    expect(getByTestId('my-button')).toBeTruthy();
  });
});
