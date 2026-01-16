#!/bin/bash
# Script para ejecutar pruebas de Maestro con configuración personalizada
# Uso: ./e2e/run-tests.sh [nombre-de-prueba]
# Ejemplo: ./e2e/run-tests.sh expo-simple-test
# Ejemplo: ./e2e/run-tests.sh expo-full-flow

# Configuración
TEST_NAME="${1:-expo-simple-test}"
RESULTS_DIR="Resultados/Maestro"
E2E_DIR="e2e"

# Crear directorio de resultados si no existe
mkdir -p "$RESULTS_DIR"

# Construir ruta del test
TEST_PATH="$E2E_DIR/$TEST_NAME.yaml"

if [ ! -f "$TEST_PATH" ]; then
    echo "Error: No se encontró el archivo de prueba: $TEST_PATH"
    echo ""
    echo "Pruebas disponibles:"
    ls -1 "$E2E_DIR"/*.yaml | sed 's/.*\///;s/\.yaml$//' | sed 's/^/  - /'
    exit 1
fi

# Ejecutar Maestro con output personalizado
echo ""
echo "=== Ejecutando prueba: $TEST_NAME ==="
echo "Resultados se guardarán en: $RESULTS_DIR"
echo ""

maestro test "$TEST_PATH" --output "$RESULTS_DIR"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Prueba completada exitosamente!"
else
    echo ""
    echo "❌ Prueba falló con código de salida: $?"
fi
