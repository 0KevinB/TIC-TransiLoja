# Script para ejecutar pruebas de Maestro con configuración personalizada
# Uso: .\e2e\run-tests.ps1 [nombre-de-prueba]
# Ejemplo: .\e2e\run-tests.ps1 expo-simple-test
# Ejemplo: .\e2e\run-tests.ps1 expo-full-flow

param(
    [string]$TestName = "expo-simple-test"
)

# Configuración
$ResultsDir = "Resultados\Maestro"
$E2EDir = "e2e"

# Crear directorio de resultados si no existe
if (!(Test-Path $ResultsDir)) {
    Write-Host "Creando directorio de resultados: $ResultsDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $ResultsDir -Force | Out-Null
}

# Construir ruta del test
$TestPath = Join-Path $E2EDir "$TestName.yaml"

if (!(Test-Path $TestPath)) {
    Write-Host "Error: No se encontró el archivo de prueba: $TestPath" -ForegroundColor Red
    Write-Host "`nPruebas disponibles:" -ForegroundColor Cyan
    Get-ChildItem -Path $E2EDir -Filter "*.yaml" | ForEach-Object {
        Write-Host "  - $($_.BaseName)" -ForegroundColor Gray
    }
    exit 1
}

# Ejecutar Maestro con output personalizado
Write-Host "`n=== Ejecutando prueba: $TestName ===" -ForegroundColor Green
Write-Host "Resultados se guardarán en: $ResultsDir`n" -ForegroundColor Cyan

maestro test $TestPath --output $ResultsDir

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Prueba completada exitosamente!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Prueba falló con código de salida: $LASTEXITCODE" -ForegroundColor Red
}
