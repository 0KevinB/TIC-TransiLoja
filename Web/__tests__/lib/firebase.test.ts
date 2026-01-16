import { auth, db, storage } from '@/lib/firebase'

describe('Firebase Configuration', () => {
  it('should export auth instance', () => {
    expect(auth).toBeDefined()
    expect(auth).toHaveProperty('currentUser')
  })

  it('should export firestore instance', () => {
    expect(db).toBeDefined()
  })

  it('should export storage instance', () => {
    expect(storage).toBeDefined()
  })

  it('should have correct auth configuration', () => {
    expect(auth.name).toBe('[DEFAULT]')
  })
})
