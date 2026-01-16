import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      // Implementar listeners para métricas de rendimiento
      on('task', {
        // Tarea para guardar métricas de performance
        logPerformance(metrics: any) {
          console.log('📊 Performance Metrics:', JSON.stringify(metrics, null, 2));
          return null;
        },
        // Tarea para guardar métricas de usabilidad
        logUsability(metrics: any) {
          console.log('🎯 Usability Metrics:', JSON.stringify(metrics, null, 2));
          return null;
        },
      });
    },
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
      reportDir: 'Resultados/Cypress',
      charts: true,
      reportPageTitle: 'TransiLoja Test Report',
      embeddedScreenshots: true,
      inlineAssets: true,
      saveAllAttempts: false,
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      // Agregar variables de entorno si es necesario
      apiUrl: 'http://localhost:3000/api',
      // Credenciales de prueba para E2E tests (usar variables de entorno)
      TEST_USER_EMAIL: process.env.CYPRESS_TEST_USER_EMAIL || 'test@example.com',
      TEST_USER_PASSWORD: process.env.CYPRESS_TEST_USER_PASSWORD || 'test_password',
      // Umbrales de rendimiento
      PERFORMANCE_THRESHOLDS: {
        pageLoadTime: 3000, // 3 segundos
        interactionTime: 500, // 500ms
        timeToInteractive: 5000, // 5 segundos
      },
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },
});
