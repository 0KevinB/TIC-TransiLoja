#!/usr/bin/env node

/**
 * Script para generar reporte consolidado de todas las pruebas
 * Combina resultados de Jest y Maestro en un reporte unificado
 */

const fs = require('fs');
const path = require('path');

const RESULTADOS_DIR = path.join(__dirname, '..', 'Resultados');
const JEST_DIR = path.join(RESULTADOS_DIR, 'Jest');
const MAESTRO_DIR = path.join(RESULTADOS_DIR, 'Maestro');
const COVERAGE_DIR = path.join(RESULTADOS_DIR, 'Coverage');

console.log('📊 Generando reporte consolidado de pruebas...\n');

// Crear estructura de directorios si no existe
[RESULTADOS_DIR, JEST_DIR, MAESTRO_DIR, path.join(MAESTRO_DIR, 'flows'), path.join(MAESTRO_DIR, 'screenshots')].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Creado: ${dir}`);
  }
});

// Función para leer resultados de Jest con categorías
function getJestResults() {
  const jestReportPath = path.join(JEST_DIR, 'junit.xml');

  if (!fs.existsSync(jestReportPath)) {
    return {
      total: 0, passed: 0, failed: 0, skipped: 0,
      categories: {
        accessibility: { total: 0, passed: 0, failed: 0 },
        integration: { total: 0, passed: 0, failed: 0 },
        performance: { total: 0, passed: 0, failed: 0 },
        unit: { total: 0, passed: 0, failed: 0 }
      }
    };
  }

  try {
    const content = fs.readFileSync(jestReportPath, 'utf8');
    const testsMatch = content.match(/tests="(\d+)"/);
    const failuresMatch = content.match(/failures="(\d+)"/);
    const skippedMatch = content.match(/skipped="(\d+)"/);

    const total = testsMatch ? parseInt(testsMatch[1]) : 0;
    const failed = failuresMatch ? parseInt(failuresMatch[1]) : 0;
    const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
    const passed = total - failed - skipped;

    // Categorizar por nombre de archivo/suite
    const categories = {
      accessibility: { total: 0, passed: 0, failed: 0 },
      integration: { total: 0, passed: 0, failed: 0 },
      performance: { total: 0, passed: 0, failed: 0 },
      unit: { total: 0, passed: 0, failed: 0 }
    };

    // Parsear testsuites para categorizar
    const testsuiteRegex = /<testsuite[^>]*name="([^"]*)"[^>]*tests="(\d+)"[^>]*failures="(\d+)"/g;
    let match;

    while ((match = testsuiteRegex.exec(content)) !== null) {
      const suiteName = match[1].toLowerCase();
      const suiteTests = parseInt(match[2]);
      const suiteFailures = parseInt(match[3]);
      const suitePassed = suiteTests - suiteFailures;

      if (suiteName.includes('accessibility') || suiteName.includes('a11y') ||
          suiteName.includes('color-modes') || suiteName.includes('text-scaling') ||
          suiteName.includes('screen-reader')) {
        categories.accessibility.total += suiteTests;
        categories.accessibility.failed += suiteFailures;
        categories.accessibility.passed += suitePassed;
      } else if (suiteName.includes('integration') || suiteName.includes('offline') ||
                 suiteName.includes('gps') || suiteName.includes('trip')) {
        categories.integration.total += suiteTests;
        categories.integration.failed += suiteFailures;
        categories.integration.passed += suitePassed;
      } else if (suiteName.includes('performance') || suiteName.includes('metrics') ||
                 suiteName.includes('rendering') || suiteName.includes('firebase-performance') ||
                 suiteName.includes('firebase-crashlytics')) {
        categories.performance.total += suiteTests;
        categories.performance.failed += suiteFailures;
        categories.performance.passed += suitePassed;
      } else {
        categories.unit.total += suiteTests;
        categories.unit.failed += suiteFailures;
        categories.unit.passed += suitePassed;
      }
    }

    return { total, passed, failed, skipped, categories };
  } catch (error) {
    console.error('⚠️  Error leyendo resultados de Jest:', error.message);
    return {
      total: 0, passed: 0, failed: 0, skipped: 0,
      categories: {
        accessibility: { total: 0, passed: 0, failed: 0 },
        integration: { total: 0, passed: 0, failed: 0 },
        performance: { total: 0, passed: 0, failed: 0 },
        unit: { total: 0, passed: 0, failed: 0 }
      }
    };
  }
}

// Función para obtener cobertura
function getCoverageStats() {
  const coveragePath = path.join(COVERAGE_DIR, 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    return null;
  }

  try {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    return coverage.total;
  } catch (error) {
    return null;
  }
}

// Función para leer resultados de Maestro
function getMaestroResults() {
  const maestroFlowsDir = path.join(MAESTRO_DIR, 'flows');

  if (!fs.existsSync(maestroFlowsDir)) {
    return { total: 0, passed: 0, failed: 0 };
  }

  try {
    const files = fs.readdirSync(maestroFlowsDir).filter(f => f.endsWith('.xml'));

    let total = 0;
    let passed = 0;
    let failed = 0;

    files.forEach(file => {
      const content = fs.readFileSync(path.join(maestroFlowsDir, file), 'utf8');
      const testsMatch = content.match(/tests="(\d+)"/);
      const failuresMatch = content.match(/failures="(\d+)"/);

      if (testsMatch) {
        const t = parseInt(testsMatch[1]);
        const f = failuresMatch ? parseInt(failuresMatch[1]) : 0;

        total += t;
        failed += f;
        passed += (t - f);
      }
    });

    return { total, passed, failed };
  } catch (error) {
    console.error('⚠️  Error leyendo resultados de Maestro:', error.message);
    return { total: 0, passed: 0, failed: 0 };
  }
}

// Generar reporte HTML
function generateHTMLReport(jestResults, maestroResults, coverage) {
  const timestamp = new Date().toLocaleString('es-EC', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const totalTests = jestResults.total + maestroResults.total;
  const totalPassed = jestResults.passed + maestroResults.passed;
  const totalFailed = jestResults.failed + maestroResults.failed;
  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TransiLoja Mobile - Reporte de Pruebas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #1f2937;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }
    .timestamp {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 2rem;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .card.success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .card.error { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .card.warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .card-title {
      font-size: 0.875rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }
    .card-value {
      font-size: 2.5rem;
      font-weight: bold;
    }
    .section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 8px;
    }
    .section h2 {
      color: #1f2937;
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }
    .stats {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .stat {
      flex: 1;
      min-width: 150px;
    }
    .stat-label {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
    }
    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      transition: width 0.3s ease;
    }
    .links {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .link {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .link:hover {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 TransiLoja Mobile - Reporte de Pruebas</h1>
    <div class="timestamp">Generado: ${timestamp}</div>

    <div class="summary">
      <div class="card">
        <div class="card-title">Total de Pruebas</div>
        <div class="card-value">${totalTests}</div>
      </div>
      <div class="card success">
        <div class="card-title">✅ Pasadas</div>
        <div class="card-value">${totalPassed}</div>
      </div>
      <div class="card error">
        <div class="card-title">❌ Fallidas</div>
        <div class="card-value">${totalFailed}</div>
      </div>
      <div class="card ${passRate >= 80 ? 'success' : passRate >= 60 ? 'warning' : 'error'}">
        <div class="card-title">Tasa de Éxito</div>
        <div class="card-value">${passRate}%</div>
      </div>
    </div>

    <div class="section">
      <h2>🧪 Resumen de Pruebas Jest</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Total</div>
          <div class="stat-value">${jestResults.total}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Pasadas</div>
          <div class="stat-value" style="color: #10b981;">${jestResults.passed}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Fallidas</div>
          <div class="stat-value" style="color: #ef4444;">${jestResults.failed}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Omitidas</div>
          <div class="stat-value" style="color: #f59e0b;">${jestResults.skipped}</div>
        </div>
      </div>
      ${jestResults.total > 0 ? `
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(jestResults.passed / jestResults.total * 100)}%"></div>
      </div>
      ` : ''}
    </div>

    ${jestResults.categories.accessibility.total > 0 ? `
    <div class="section">
      <h2>♿ Pruebas de Accesibilidad</h2>
      <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.9rem;">
        Validación de 3 modos de color, 3 tamaños de texto, contraste WCAG, y soporte para screen readers (TalkBack/VoiceOver)
      </p>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Total</div>
          <div class="stat-value">${jestResults.categories.accessibility.total}</div>
        </div>
        <div class="stat">
          <div class="stat-label">✅ Pasadas</div>
          <div class="stat-value" style="color: #10b981;">${jestResults.categories.accessibility.passed}</div>
        </div>
        <div class="stat">
          <div class="stat-label">❌ Fallidas</div>
          <div class="stat-value" style="color: #ef4444;">${jestResults.categories.accessibility.failed}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Tasa de Éxito</div>
          <div class="stat-value">${jestResults.categories.accessibility.total > 0 ? ((jestResults.categories.accessibility.passed / jestResults.categories.accessibility.total * 100).toFixed(1)) : 0}%</div>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${jestResults.categories.accessibility.total > 0 ? (jestResults.categories.accessibility.passed / jestResults.categories.accessibility.total * 100) : 0}%"></div>
      </div>
    </div>
    ` : ''}

    ${jestResults.categories.integration.total > 0 ? `
    <div class="section">
      <h2>🔗 Pruebas de Integración</h2>
      <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.9rem;">
        Modo offline, GPS tracking, creación de viajes, y sincronización de datos
      </p>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Total</div>
          <div class="stat-value">${jestResults.categories.integration.total}</div>
        </div>
        <div class="stat">
          <div class="stat-label">✅ Pasadas</div>
          <div class="stat-value" style="color: #10b981;">${jestResults.categories.integration.passed}</div>
        </div>
        <div class="stat">
          <div class="stat-label">❌ Fallidas</div>
          <div class="stat-value" style="color: #ef4444;">${jestResults.categories.integration.failed}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Tasa de Éxito</div>
          <div class="stat-value">${jestResults.categories.integration.total > 0 ? ((jestResults.categories.integration.passed / jestResults.categories.integration.total * 100).toFixed(1)) : 0}%</div>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${jestResults.categories.integration.total > 0 ? (jestResults.categories.integration.passed / jestResults.categories.integration.total * 100) : 0}%"></div>
      </div>
    </div>
    ` : ''}

    ${jestResults.categories.performance.total > 0 ? `
    <div class="section">
      <h2>⚡ Pruebas de Rendimiento</h2>
      <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.9rem;">
        Métricas de renderizado, algoritmo RAPTOR, Firebase Performance y Crashlytics
      </p>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Total</div>
          <div class="stat-value">${jestResults.categories.performance.total}</div>
        </div>
        <div class="stat">
          <div class="stat-label">✅ Pasadas</div>
          <div class="stat-value" style="color: #10b981;">${jestResults.categories.performance.passed}</div>
        </div>
        <div class="stat">
          <div class="stat-label">❌ Fallidas</div>
          <div class="stat-value" style="color: #ef4444;">${jestResults.categories.performance.failed}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Tasa de Éxito</div>
          <div class="stat-value">${jestResults.categories.performance.total > 0 ? ((jestResults.categories.performance.passed / jestResults.categories.performance.total * 100).toFixed(1)) : 0}%</div>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${jestResults.categories.performance.total > 0 ? (jestResults.categories.performance.passed / jestResults.categories.performance.total * 100) : 0}%"></div>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h2>🔥 Firebase Performance Monitoring</h2>
      <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.9rem;">
        Monitoreo de rendimiento en tiempo real con Firebase Performance
      </p>
      <div style="background: #fff; padding: 1rem; border-radius: 6px; border-left: 4px solid #667eea;">
        <p style="margin-bottom: 0.5rem;"><strong>Métricas configuradas:</strong></p>
        <ul style="color: #4b5563; font-size: 0.875rem; line-height: 1.8; padding-left: 1.5rem;">
          <li>⏱️ Tiempo de inicio de app (app_start)</li>
          <li>🔄 Operaciones Firestore (read/write/query)</li>
          <li>🔐 Autenticación (auth_sign_in)</li>
          <li>📱 Navegación entre pantallas (screen transitions)</li>
          <li>🚀 Algoritmo RAPTOR (raptor_calculate_route)</li>
          <li>💾 Caché AsyncStorage (cache_read/write)</li>
          <li>📍 GPS tracking (gps_update)</li>
          <li>🌐 HTTP requests (automático)</li>
          <li>📊 Custom metrics (personalizadas)</li>
        </ul>
        <p style="margin-top: 1rem; color: #667eea; font-size: 0.875rem;">
          📈 Visualizar en:
          <a href="https://console.firebase.google.com" target="_blank" style="color: #667eea; text-decoration: underline;">
            Firebase Console → Performance
          </a>
        </p>
      </div>
    </div>

    <div class="section">
      <h2>🛡️ Firebase Crashlytics (Disponibilidad)</h2>
      <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.9rem;">
        Monitoreo de crashes y disponibilidad de la app
      </p>
      <div style="background: #fff; padding: 1rem; border-radius: 6px; border-left: 4px solid #10b981;">
        <p style="margin-bottom: 0.5rem;"><strong>Funcionalidades configuradas:</strong></p>
        <ul style="color: #4b5563; font-size: 0.875rem; line-height: 1.8; padding-left: 1.5rem;">
          <li>💥 Registro de crashes fatales (automático)</li>
          <li>⚠️ Registro de errores no fatales</li>
          <li>📝 Logs de actividad del usuario</li>
          <li>👤 Atributos personalizados (user ID, device info)</li>
          <li>🎯 Contexto de errores (screen, action, data)</li>
          <li>🔄 Eventos de disponibilidad (app lifecycle)</li>
          <li>📊 Métricas de uptime y crash-free rate</li>
          <li>📡 Reportes offline (sincronización automática)</li>
        </ul>
        <p style="margin-top: 1rem;">
          <strong style="color: #10b981;">Métricas clave:</strong>
        </p>
        <ul style="color: #4b5563; font-size: 0.875rem; line-height: 1.8; padding-left: 1.5rem;">
          <li>Crash-free users: % de usuarios sin crashes</li>
          <li>Crash-free sessions: % de sesiones sin crashes</li>
          <li>Velocity: Nuevos crashes en las últimas 24h</li>
          <li>Stability score: Puntuación general de estabilidad</li>
        </ul>
        <p style="margin-top: 1rem; color: #10b981; font-size: 0.875rem;">
          📈 Visualizar en:
          <a href="https://console.firebase.google.com" target="_blank" style="color: #10b981; text-decoration: underline;">
            Firebase Console → Crashlytics
          </a>
        </p>
      </div>
    </div>

    <div class="section">
      <h2>🎭 Pruebas E2E (Maestro)</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Total</div>
          <div class="stat-value">${maestroResults.total}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Pasadas</div>
          <div class="stat-value" style="color: #10b981;">${maestroResults.passed}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Fallidas</div>
          <div class="stat-value" style="color: #ef4444;">${maestroResults.failed}</div>
        </div>
      </div>
      ${maestroResults.total > 0 ? `
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(maestroResults.passed / maestroResults.total * 100)}%"></div>
      </div>
      ` : ''}
    </div>

    ${coverage ? `
    <div class="section">
      <h2>📈 Cobertura de Código</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Líneas</div>
          <div class="stat-value">${coverage.lines.pct}%</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${coverage.lines.pct}%"></div>
          </div>
        </div>
        <div class="stat">
          <div class="stat-label">Funciones</div>
          <div class="stat-value">${coverage.functions.pct}%</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${coverage.functions.pct}%"></div>
          </div>
        </div>
        <div class="stat">
          <div class="stat-label">Branches</div>
          <div class="stat-value">${coverage.branches.pct}%</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${coverage.branches.pct}%"></div>
          </div>
        </div>
        <div class="stat">
          <div class="stat-label">Statements</div>
          <div class="stat-value">${coverage.statements.pct}%</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${coverage.statements.pct}%"></div>
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h2>🔗 Enlaces Rápidos</h2>
      <div class="links">
        <a href="Jest/index.html" class="link">📊 Reporte Jest Detallado</a>
        <a href="Coverage/index.html" class="link">📈 Reporte de Cobertura</a>
        <a href="Maestro/screenshots/" class="link">📸 Screenshots Maestro</a>
        <a href="../ACCESSIBILITY.md" class="link">♿ Guía de Accesibilidad</a>
      </div>
    </div>

    <div class="footer">
      <p>TransiLoja Mobile Test Suite v1.0.0</p>
      <p>Sistema de transporte público - Loja, Ecuador</p>
    </div>
  </div>
</body>
</html>
  `;

  fs.writeFileSync(path.join(RESULTADOS_DIR, 'index.html'), html);
  console.log('✅ Reporte HTML generado: Resultados/index.html');
}

// Ejecutar
const jestResults = getJestResults();
const maestroResults = getMaestroResults();
const coverage = getCoverageStats();

console.log('📊 Resultados de Pruebas:\n');
console.log(`Jest:    ${jestResults.passed}/${jestResults.total} pasadas`);
console.log(`Maestro: ${maestroResults.passed}/${maestroResults.total} pasadas`);
console.log(`Total:   ${jestResults.passed + maestroResults.passed}/${jestResults.total + maestroResults.total} pasadas\n`);

generateHTMLReport(jestResults, maestroResults, coverage);

console.log('\n✅ Reporte consolidado generado exitosamente');
console.log(`📂 Abrir: Resultados/index.html\n`);
