const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Credenciales de prueba - IMPORTANTE: Configurar variables de entorno
const TEST_EMAIL = process.env.LIGHTHOUSE_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.LIGHTHOUSE_TEST_PASSWORD || 'test_password';

// URLs clave a probar (públicas + dashboard principales)
const publicUrls = [
  'https://transi-loja.vercel.app/', // Login page
];

const authenticatedUrls = [
  'https://transi-loja.vercel.app/dashboard',
  'https://transi-loja.vercel.app/dashboard/buses',
  'https://transi-loja.vercel.app/dashboard/routes',
  'https://transi-loja.vercel.app/dashboard/stops',
  'https://transi-loja.vercel.app/dashboard/trips',
  'https://transi-loja.vercel.app/dashboard/drivers',
  'https://transi-loja.vercel.app/dashboard/alerts',
  'https://transi-loja.vercel.app/dashboard/reports',
];

const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  },
};

async function performLogin(page) {
  console.log('\n🔐 Iniciando sesión automática...');

  try {
    // Navegar a la página de login
    await page.goto('https://transi-loja.vercel.app/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('📝 Esperando formulario de login...');

    // Esperar a que cargue el formulario de login
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });

    // Llenar credenciales
    console.log('✍️  Ingresando credenciales...');
    await page.type('input[type="email"]', TEST_EMAIL, { delay: 50 });
    await page.type('input[type="password"]', TEST_PASSWORD, { delay: 50 });

    // Click en botón de login
    console.log('🚀 Enviando formulario...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    console.log('⏳ Esperando redirección al dashboard...');

    // Verificar que llegamos al dashboard
    await page.waitForFunction(
      () => window.location.pathname.includes('/dashboard'),
      { timeout: 30000 }
    );

    // Esperar un poco más para que Firebase termine de inicializar
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('✅ Login exitoso - Sesión establecida');

    return true;
  } catch (error) {
    console.error('❌ Error durante el login:', error.message);
    throw new Error(`Failed to authenticate: ${error.message}`);
  }
}

async function runLighthouse(url, browser) {
  console.log(`\n🔍 Analizando: ${url}`);

  // Dynamic import para Lighthouse (ESM)
  const { default: lighthouse } = await import('lighthouse');

  try {
    // Obtener el WebSocket debugger URL del browser
    const browserWSEndpoint = browser.wsEndpoint();

    const options = {
      logLevel: 'error',
      output: 'html',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: new URL(browserWSEndpoint).port,
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
    };

    const runnerResult = await lighthouse(url, options, lighthouseConfig);

    if (!runnerResult) {
      throw new Error('Lighthouse no retornó resultados');
    }

    return runnerResult;
  } catch (error) {
    console.error(`❌ Error analizando ${url}:`, error.message);
    return null;
  }
}

(async () => {
  console.log('🚀 Iniciando Lighthouse CI para TransiLoja\n');
  console.log('📊 Configuración: Desktop, Throttling reducido\n');

  const reportDir = path.join(__dirname, '../Resultados/Lighthouse');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // Limpiar reportes antiguos
  console.log('🧹 Limpiando reportes antiguos...');
  const oldReports = fs.readdirSync(reportDir).filter(f => f.endsWith('.html'));
  oldReports.forEach(f => fs.unlinkSync(path.join(reportDir, f)));

  let browser = null;
  let page = null;

  try {
    // 1. Probar URLs públicas (sin autenticación)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📂 FASE 1: Analizando páginas públicas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Lanzar Puppeteer con remote debugging habilitado
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1350,940',
        '--remote-debugging-port=9222',
      ],
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1350, height: 940 });

    for (const url of publicUrls) {
      const result = await runLighthouse(url, browser);

      if (result) {
        const reportHtml = result.report;
        const urlSlug = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const reportPath = path.join(reportDir, `lighthouse-${urlSlug}.html`);

        fs.writeFileSync(reportPath, reportHtml);

        const scores = result.lhr.categories;
        console.log(`✅ Reporte guardado: ${urlSlug}.html`);
        console.log(`   Performance: ${Math.round(scores.performance.score * 100)}`);
        console.log(`   Accessibility: ${Math.round(scores.accessibility.score * 100)}`);
        console.log(`   Best Practices: ${Math.round(scores['best-practices'].score * 100)}`);
        console.log(`   SEO: ${Math.round(scores.seo.score * 100)}`);
      }
    }

    // 2. Hacer login manteniendo la sesión activa
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 FASE 2: Autenticación');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await performLogin(page);

    // 3. Probar URLs autenticadas usando el mismo browser con sesión activa
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔒 FASE 3: Analizando páginas autenticadas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const url of authenticatedUrls) {
      const result = await runLighthouse(url, browser);

      if (result) {
        const reportHtml = result.report;
        const urlSlug = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const reportPath = path.join(reportDir, `lighthouse-${urlSlug}.html`);

        fs.writeFileSync(reportPath, reportHtml);

        const scores = result.lhr.categories;
        console.log(`✅ Reporte guardado: ${urlSlug}.html`);
        console.log(`   Performance: ${Math.round(scores.performance.score * 100)}`);
        console.log(`   Accessibility: ${Math.round(scores.accessibility.score * 100)}`);
        console.log(`   Best Practices: ${Math.round(scores['best-practices'].score * 100)}`);
        console.log(`   SEO: ${Math.round(scores.seo.score * 100)}`);
      }

      // Pequeña pausa entre análisis para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Análisis completado exitosamente');
    console.log(`📁 Reportes guardados en: ${reportDir}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error durante la ejecución:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cerrar browser si todavía está abierto
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.warn('⚠️  Error al cerrar browser (no es crítico)');
      }
    }
  }
})();
