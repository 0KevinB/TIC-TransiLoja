describe('Dashboard', () => {
  // Capture error to file
  afterEach(function() {
    if (this.currentTest.state === 'failed') {
      cy.writeFile('cypress_failure.txt', `Test: ${this.currentTest.title}\nError: ${this.currentTest.err.message}\nStack: ${this.currentTest.err.stack}`, { flag: 'a+' })
    }
  })
  beforeEach(() => {
    // Login antes de cada test
    cy.login()
    cy.visit('/dashboard', { failOnStatusCode: false })
    // Esperar a que cargue la página
    cy.wait(2000)
  })

  it('debe mostrar la página del dashboard', () => {
    // Verificar que estamos en el dashboard
    cy.url().should('include', '/dashboard')

    // Buscar el título del dashboard
    cy.get('h1', { timeout: 15000 }).should('be.visible').and(($h1) => {
      const text = $h1.text()
      expect(text).to.match(/Bienvenido|TransiLoja/i)
    })
  })

  it('debe mostrar el menú de navegación', () => {
    cy.contains(/paradas|stops/i).should('be.visible')
    cy.contains(/rutas|routes/i).should('be.visible')
    cy.contains(/buses|vehículos/i).should('be.visible')
    cy.contains(/conductores|drivers/i).should('be.visible')
  })

  it('debe navegar a diferentes secciones', () => {
    cy.contains(/paradas|stops/i).click({ force: true })
    cy.url().should('include', '/stops')

    cy.contains(/rutas|routes/i).click({ force: true })
    cy.url().should('include', '/routes')

    cy.contains(/buses|vehículos/i).click({ force: true })
    cy.url().should('include', '/buses')
  })

  it('debe mostrar métricas del dashboard', () => {
    // Verificar que se muestran métricas básicas
    cy.contains('Paradas').should('be.visible')
    cy.contains('Rutas').should('be.visible')
    cy.contains('Buses').should('be.visible')
  })
})
