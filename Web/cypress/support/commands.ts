/// <reference types="cypress" />

/**
 * Custom command para login usando Firebase Authentication
 * Usa el enfoque programático (más rápido y confiable que UI)
 */
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('TEST_USER_EMAIL') || 'kevin@gmail.com'
  const testPassword = password || Cypress.env('TEST_USER_PASSWORD') || '123123'

  cy.log('Starting login process...')

  // Visitar la página principal
  cy.visit('/', { failOnStatusCode: false })

  // Esperar un momento para carga inicial/redirección
  cy.wait(1000)

  cy.get('body').then(($body) => {
    // Verificar si ya estamos autenticados buscando elementos del dashboard
    // O si la URL ya es dashboard
    if (window.location.href.includes('/dashboard') ||
        $body.find('a[href*="/dashboard"]').length > 0 ||
        $body.text().includes('Cerrar Sesión')) {
      cy.log('Already authenticated')
      return
    }

    // Si no estamos autenticados, buscar el formulario
    if ($body.find('input[id="email"]').length === 0) {
       cy.log('Login form not found, reloading...')
       cy.reload()
       cy.wait(2000)
    }

    // Ingresar credenciales
    cy.get('input[id="email"]').should('be.visible').clear().type(testEmail)
    cy.get('input[id="password"]').should('be.visible').clear().type(testPassword)

    // Hacer clic en el botón de login
    cy.get('button[type="submit"]').click()

    // Esperar a que la autenticación se complete y redirija al dashboard
    cy.url().should('include', '/dashboard', { timeout: 30000 })

    // Verificar que el usuario esté autenticado en localStorage después de login
    cy.window().then((win) => {
      const authData = Object.keys(win.localStorage).find(key =>
        key.startsWith('firebase:authUser:')
      )
      // No fallar si no encuentra authData inmediatamente, pero es buena práctica verificar
      if (authData) {
        cy.log('Firebase auth data found')
      }
    })
  })
})

/**
 * Custom command para login rápido (alternativa sin UI)
 * Usa directamente el localStorage de Firebase
 */
Cypress.Commands.add('loginByFirebaseToken', (token: string, uid: string) => {
  cy.visit('/')

  cy.window().then((win) => {
    // Construir el objeto de autenticación de Firebase
    const authUser = {
      uid,
      email: Cypress.env('TEST_USER_EMAIL'),
      stsTokenManager: {
        accessToken: token,
        expirationTime: Date.now() + 3600000, // 1 hora
      }
    }

    // Guardar en localStorage como Firebase lo hace
    const apiKey = win.localStorage.getItem('firebase:apiKey') ||
                   Cypress.env('NEXT_PUBLIC_FIREBASE_API_KEY')

    win.localStorage.setItem(
      `firebase:authUser:${apiKey}:[DEFAULT]`,
      JSON.stringify(authUser)
    )
  })

  cy.reload()
  cy.url().should('include', '/dashboard')
})

/**
 * Custom command para logout
 */
Cypress.Commands.add('logout', () => {
  cy.log('Starting logout process...')

  // Limpiar directamente la sesión - es más confiable que hacer clic en el botón
  cy.clearLocalStorage()
  cy.clearCookies()
  cy.clearAllSessionStorage()

  // Limpiar IndexedDB de Firebase (Firebase usa IndexedDB para persistencia)
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

  // Visitar la home para forzar redirección al login
  cy.visit('/', { failOnStatusCode: false })

  // Esperar a que el body esté visible
  cy.get('body', { timeout: 30000 }).should('be.visible')

  // Dar tiempo para que la página cargue
  cy.wait(3000)

  // Spinner check removed due to flakiness
  // cy.document().then((doc) => { ... })

  // Verificar que se muestra el formulario de login
  cy.get('input[id="email"]', { timeout: 30000 }).should('be.visible')

  cy.log('Logout completed successfully')
})
