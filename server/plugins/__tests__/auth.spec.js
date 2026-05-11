import auth from '../auth.js'

describe('auth', () => {
  it('should return a valid auth object', () => {
    expect(auth).toBeInstanceOf(Object)
    expect(auth.name).toBe('auth')
    expect(auth.register).toBeInstanceOf(Function)
  })
})
