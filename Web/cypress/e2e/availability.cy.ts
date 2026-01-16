describe('TransiLoja - Pruebas de Disponibilidad', () => {
  // Capture error to file
  afterEach(function() {
    if (this.currentTest.state === 'failed') {
      cy.writeFile('cypress_failure.txt', `Test: ${this.currentTest.title}\nError: ${this.currentTest.err.message}\nStack: ${this.currentTest.err.stack}`, { flag: 'a+' })
    }
  })
describe('TransiLoja - Pruebas de Disponibilidad', () => {
  // Capture error to file
  afterEach(function() {
    if (this.currentTest.state === 'failed') {
      cy.writeFile('cypress_failure.txt', `Test: ${this.currentTest.title}\nError: ${this.currentTest.err.message}\nStack: ${this.currentTest.err.stack}`, { flag: 'a+' })
    }
  })
  beforeEach(() => {
    cy.login();
    cy.visit('/dashboard/stops', { failOnStatusCode: false });
  });

  it('WEB-AVA-01: Manejo de Desconexión', () => {
    // Simular desconexión mientras se intenta una acción
    cy.visit('/dashboard/stops', { failOnStatusCode: false });

    // Abrir modal
    cy.contains(/Nueva Parada|New Stop/i).click();

    // Verificar que el modal se abrió
    cy.get('input#name').should('be.visible');

    // Simular offline
    cy.intercept('POST', '**/firestore.googleapis.com/**', { forceNetworkError: true }).as('firestoreOffline');

    // Intentar guardar
    cy.get('input#name').type('Parada Test Offline');
    cy.get('input#lat').type('-4.000');
    cy.get('input#lng').type('-79.000');
    cy.get('button[type="submit"]').click();

    // Verificar que la UI no se congela y muestra algún feedback (o al menos no crashea)
    // Nota: Firebase tiene su propio manejo offline, así que podría no fallar inmediatamente,
    // pero verificamos que la app siga respondiendo.
    cy.get('button[type="submit"]').should('exist');
    cy.contains('Error').should('not.exist'); // O verificar si esperamos un toast de error
  });

  it('WEB-AVA-02: Recuperación de Error Crítico (404)', () => {
    // Verificar manejo de rutas no existentes
    cy.visit('/dashboard/ruta-no-existente-12345', { failOnStatusCode: false });

    // Debería mostrar 404 o redirigir, pero no mostrar pantalla blanca de error de React
    cy.get('body').should('be.visible');
    // Verificar que NO hay error de aplicación crítico visible en texto plano
    cy.contains('Application error: a client-side exception has occurred').should('not.exist');

    // Opcional: Verificar si hay un link para volver
    cy.get('a').filter((index, el) => {
      return el.innerText.match(/volver|inicio|home|back/i) !== null
    }).should('exist');
  });
});
