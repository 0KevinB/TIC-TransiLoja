describe('TransiLoja - Pruebas de Rendimiento', () => {
  // Capture error to file
  afterEach(function() {
    if (this.currentTest.state === 'failed') {
      cy.writeFile('cypress_failure.txt', `Test: ${this.currentTest.title}\nError: ${this.currentTest.err.message}\nStack: ${this.currentTest.err.stack}`, { flag: 'a+' })
    }
  })
  it('WEB-PER-01: Tiempo de Carga del Dashboard (Producción)', () => {
    const t0 = performance.now();
    // Visitar página principal (mostrará login si no hay sesión)
    cy.visit('/', { failOnStatusCode: false });

  it('WEB-PER-01: Tiempo de Carga del Dashboard (Producción)', () => {
    const t0 = performance.now();
    // Visitar página principal
    cy.visit('/', { failOnStatusCode: false });

    // Verificar si necesitamos login
    cy.get('body').then($body => {
      if ($body.find('input[type="email"]').length > 0) {
        cy.get('input[type="email"]').type(Cypress.env('TEST_USER_EMAIL'));
        cy.get('input[type="password"]').type(Cypress.env('TEST_USER_PASSWORD'));
        cy.get('button[type="submit"]').click();
      }
    });

    // Esperar redirección
    cy.url().should('include', '/dashboard').then(() => {
      const t1 = performance.now();
      const loadTime = t1 - t0;
      cy.log(`Dashboard Load Time (Prod): ${loadTime}ms`);
      cy.task('logPerformance', { metric: 'Dashboard Load (Prod)', value: loadTime });
      // Umbral ajustado para entorno de pruebas
      expect(loadTime).to.be.lessThan(10000);
    });
  });

  it('WEB-PER-02: Renderizado de Mapa', () => {
    // Usar comando personalizado de login para reutilizar sesión
    cy.login();

    cy.visit('/dashboard/live-buses', { failOnStatusCode: false });

    cy.window().then((win) => {
      const start = win.performance.now();
      // Esperar a que el mapa cargue (selector de leaflet)
      cy.get('.leaflet-container', { timeout: 10000 }).should('be.visible');
      // Simular interacción
      cy.wait(1000);
      const end = win.performance.now();
      const renderTime = end - start;
      cy.log(`Map Render Time: ${renderTime}ms`);
      cy.task('logPerformance', { metric: 'Map Render', value: renderTime });
    });
  });
});
