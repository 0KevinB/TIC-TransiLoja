export const login = (email, password) => {
  const testEmail = email || Cypress.env('TEST_USER_EMAIL') || 'kevin@gmail.com'
  const testPassword = password || Cypress.env('TEST_USER_PASSWORD') || '123123'

  cy.log('Starting login process... JS HELPER VERSION (30s timeout)')

  cy.visit('/', { failOnStatusCode: false })

  cy.get('body').then(($body) => {
    if ($body.find('.animate-spin').length > 0) {
      cy.get('.animate-spin', { timeout: 15000 }).should('not.exist')
    }
  })

  cy.url().then((url) => {
    if (url.includes('/dashboard')) {
      cy.log('Already authenticated and redirected to dashboard')
      return
    }

    cy.get('input[id="email"]', { timeout: 30000 }).should('be.visible')

    cy.get('input[id="email"]').clear().type(testEmail)
    cy.get('input[id="password"]').clear().type(testPassword)

    cy.get('button[type="submit"]').click()

    cy.url().should('include', '/dashboard', { timeout: 30000 })
  })

  cy.window().then((win) => {
    const authData = Object.keys(win.localStorage).find(key =>
      key.startsWith('firebase:authUser:')
    )
    expect(authData).to.exist
  })
}
