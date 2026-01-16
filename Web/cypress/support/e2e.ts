// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import 'cypress-mochawesome-reporter/register';
import './commands'

beforeEach(() => {
  cy.clearCookies()
  cy.clearLocalStorage()
  cy.clearAllSessionStorage()

  // Clear Firebase IndexedDB
  cy.window().then((win) => {
    // @ts-ignore
    if (win.indexedDB && win.indexedDB.databases) {
      // @ts-ignore
      win.indexedDB.databases().then((dbs) => {
        dbs.forEach((db: any) => {
          if (db.name && db.name.includes('firebase')) {
            win.indexedDB.deleteDatabase(db.name)
          }
        })
      })
    }
  })
})


// Alternatively you can use CommonJS syntax:
// require('./commands')

// Prevent TypeScript errors
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login usando Firebase Authentication (UI-based)
       * @param email - Email del usuario (opcional, usa variable de entorno si no se proporciona)
       * @param password - Password del usuario (opcional, usa variable de entorno si no se proporciona)
       * @example cy.login()
       * @example cy.login('test@example.com', 'password123')
       */
      login(email?: string, password?: string): Chainable<void>

      /**
       * Login usando directamente el token de Firebase (más rápido)
       * @param token - Access token de Firebase
       * @param uid - User ID de Firebase
       * @example cy.loginByFirebaseToken('token123', 'uid123')
       */
      loginByFirebaseToken(token: string, uid: string): Chainable<void>

      /**
       * Logout del usuario actual
       * @example cy.logout()
       */
      logout(): Chainable<void>
    }
  }
}
