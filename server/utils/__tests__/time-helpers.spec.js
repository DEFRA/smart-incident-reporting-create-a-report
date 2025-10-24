import { formatTime24hr } from '../time-helpers.js'

describe('formatTime24hr (simple 24hr only)', () => {
  // ---- Valid time inputs with ":" separator ----
  it('Should handle valid hh:mm inputs', () => {
    expect(formatTime24hr('00:00')).toBe('00:00')
    expect(formatTime24hr('09:15')).toBe('09:15')
    expect(formatTime24hr('23:59')).toBe('23:59')
    expect(formatTime24hr('5:7')).toBe('05:07')
    expect(formatTime24hr('5:07')).toBe('05:07')
    expect(formatTime24hr('15:5')).toBe('15:05')
  })

  // ---- Acceptable separators ----
  it('Should normalize and handle . ; - separators', () => {
    expect(formatTime24hr('12.30')).toBe('12:30')
    expect(formatTime24hr('9;45')).toBe('09:45')
    expect(formatTime24hr('6-15')).toBe('06:15')
  })

  // ---- Invalid time formats ----
  it('Should reject invalid or out-of-range time', () => {
    expect(formatTime24hr('24:00')).toBe('INVALID_TIME_FORMAT') // hour out of range
    expect(formatTime24hr('23:60')).toBe('INVALID_TIME_FORMAT') // minute out of range
    expect(formatTime24hr('99:99')).toBe('INVALID_TIME_FORMAT')
    expect(formatTime24hr('12:')).toBe('INVALID_TIME_FORMAT')
    expect(formatTime24hr(':30')).toBe('INVALID_TIME_FORMAT')
    expect(formatTime24hr('')).toBe('INVALID_TIME_FORMAT')
    expect(formatTime24hr('hello')).toBe('INVALID_TIME_FORMAT')
    expect(formatTime24hr('5.')).toBe('INVALID_TIME_FORMAT')
  })

  // ---- Leading/trailing spaces ----
  it('Should trim input and handle leading/trailing spaces', () => {
    expect(formatTime24hr(' 13:05 ')).toBe('13:05')
    expect(formatTime24hr(' 7-5 ')).toBe('07:05')
  })

  // ---- Extra spaces or multiple separators (should fail) ----
  it('Should reject badly formatted input', () => {
    expect(formatTime24hr('7 5')).toBe('INVALID_TIME_FORMAT') // space not allowed
    expect(formatTime24hr('7::5')).toBe('INVALID_TIME_FORMAT') // double colon
    expect(formatTime24hr('12/30')).toBe('INVALID_TIME_FORMAT') // unsupported "/"
    expect(formatTime24hr('12:30pm')).toBe('INVALID_TIME_FORMAT') // am/pm not supported
  })

  // ---- Edge time values ----
  it('Should handle edge valid times correctly', () => {
    expect(formatTime24hr('0:0')).toBe('00:00')
    expect(formatTime24hr('23:59')).toBe('23:59')
  })

  // ---- Single digit hour/minute combinations ----
  it('Should handle single-digit hour or minute correctly', () => {
    expect(formatTime24hr('2:5')).toBe('02:05')
    expect(formatTime24hr('2:15')).toBe('02:15')
    expect(formatTime24hr('12:5')).toBe('12:05')
  })
})
