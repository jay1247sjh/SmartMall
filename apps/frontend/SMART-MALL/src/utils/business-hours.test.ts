import { describe, expect, it } from 'vitest'
import {
  FULL_DAY_BUSINESS_HOURS,
  buildBusinessHoursFromPicker,
  isAllDayBusinessHours,
  isOvernightBusinessHours,
  isValidBusinessHours,
  parseBusinessHours,
  toDisplayBusinessHours,
  toPickerRange,
} from './business-hours'

describe('business-hours utils', () => {
  it('parses normal hours', () => {
    expect(parseBusinessHours('08:00-22:00')).toEqual(['08:00', '22:00'])
  })

  it('supports overnight hours', () => {
    expect(parseBusinessHours('22:00-02:00')).toEqual(['22:00', '02:00'])
    expect(isOvernightBusinessHours('22:00-02:00')).toBe(true)
  })

  it('supports 24h hours with canonical format', () => {
    expect(parseBusinessHours(FULL_DAY_BUSINESS_HOURS)).toEqual(['00:00', '24:00'])
    expect(isAllDayBusinessHours(FULL_DAY_BUSINESS_HOURS)).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(parseBusinessHours('8:00-22:00')).toBeNull()
    expect(parseBusinessHours('00:00-00:00')).toBeNull()
    expect(parseBusinessHours('00:00-24:30')).toBeNull()
    expect(parseBusinessHours('22:00-24:00')).toBeNull()
  })

  it('allows empty as valid optional field', () => {
    expect(isValidBusinessHours('')).toBe(true)
    expect(isValidBusinessHours(undefined)).toBe(true)
  })

  it('builds values from picker', () => {
    expect(buildBusinessHoursFromPicker(['09:00', '18:00'], false)).toBe('09:00-18:00')
    expect(buildBusinessHoursFromPicker(null, true)).toBe(FULL_DAY_BUSINESS_HOURS)
    expect(buildBusinessHoursFromPicker(null, false)).toBe('')
  })

  it('maps picker values for non-all-day entries only', () => {
    expect(toPickerRange('08:00-22:00')).toEqual(['08:00', '22:00'])
    expect(toPickerRange(FULL_DAY_BUSINESS_HOURS)).toBeNull()
  })

  it('formats display text for overnight and full-day', () => {
    expect(toDisplayBusinessHours('22:00-02:00', { nextDayPrefix: '次日' })).toBe('22:00-次日02:00')
    expect(toDisplayBusinessHours(FULL_DAY_BUSINESS_HOURS, { allDayText: '24小时营业' })).toBe('24小时营业')
  })
})
