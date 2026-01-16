describe('Authentication Flow', () => {
  beforeEach(() => {
    // Limpiar sesión antes de cada test de auth
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should display login form', () => {
    cy.visit('/', { failOnStatusCode: false })
    cy.get('input[id="email"]', { timeout: 10000 }).should('be.visible')
    cy.get('input[id="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
    cy.contains(/iniciar sesión|login/i).should('be.visible')
  })

  it('should show error with invalid credentials', () => {
    cy.visit('/', { failOnStatusCode: false })
    cy.get('input[id="email"]', { timeout: 10000 }).type('invalid@test.com')
    cy.get('input[id="password"]').type('wrongpassword123')
    cy.get('button[type="submit"]').click()

    // Firebase mostrará un error
    cy.contains(/error|invalid|incorrecto/i, { timeout: 10000 }).should('be.visible')
  })

  it('should login successfully with valid credentials', () => {
    cy.visit('/', { failOnStatusCode: false })

    const email = Cypress.env('TEST_USER_EMAIL') || 'test@transiloja.com'
    const password = Cypress.env('TEST_USER_PASSWORD') || 'test123456'

    cy.get('input[id="email"]', { timeout: 10000 }).type(email)
    cy.get('input[id="password"]').type(password)
    cy.get('button[type="submit"]').click()

    // Debe redirigir al dashboard
    cy.url().should('include', '/dashboard', { timeout: 15000 })
  })

  it('debe cerrar sesión correctamente', () => {
    // Usar el comando personalizado para login
    cy.login()

    // Verificar que estamos en el dashboard
    cy.visit('/dashboard', { failOnStatusCode: false })
    cy.url().should('include', '/dashboard')

    // Ejecutar logout
    cy.logout()

    // Verificar que volvió al login
    cy.get('input[id="email"]', { timeout: 5000 }).should('be.visible')
  })

  it('should redirect to home when accessing protected route without auth', () => {
    // Limpiar TODA la sesión incluyendo IndexedDB (Firebase lo usa)
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.clearAllSessionStorage()

    // Limpiar IndexedDB de Firebase
    cy.window().then((win) => {
      if (win.indexedDB.databases) {
        win.indexedDB.databases().then((dbs: any[]) => {
          dbs.forEach((db: any) => {
            if (db.name?.includes('firebase')) {
              win.indexedDB.deleteDatabase(db.name)
            }
          })
        })
      }
    })

    cy.visit('/dashboard', { failOnStatusCode: false })

    // Esperar a que la app procese la redirección
    cy.wait(2000)

    // Debe redirigir a la página principal (login) o mostrar formulario de login
    cy.url().then((url) => {
      // Aceptar tanto redirección a / como quedarse en /dashboard pero mostrando login
      if (url.includes('/dashboard')) {
        // Si se queda en dashboard, debe mostrar el formulario de login
        cy.get('input[id="email"]', { timeout: 10000 }).should('be.visible')
      } else {
        // Si redirige, debe estar en la página principal
        expect(url).to.not.include('/dashboard')
      }
    })
  })

  it('debe mantener la sesión después de recargar', () => {
    cy.login()

    cy.visit('/dashboard', { failOnStatusCode: false })
    cy.url().should('include', '/dashboard', { timeout: 10000 })

    // Verificar que hay contenido del dashboard visible
    cy.contains(/dashboard|inicio|paradas|rutas/i, { timeout: 10000 }).should('exist')

    // Recargar la página
    cy.reload()

    // Esperar a que cargue
    cy.wait(2000)

    // Debe mantener la sesión - verificar que NO muestra el login
    cy.get('body').then(($body) => {
      // Si hay input de email, la sesión no se mantuvo
      const hasLoginForm = $body.find('input[id="email"]').length > 0

      if (!hasLoginForm) {
        // Sesión mantenida correctamente
        cy.url().should('include', '/dashboard')
      } else {
        // Si muestra login, fallar el test
        throw new Error('La sesión no se mantuvo después de recargar')
      }
    })
  })
})
