import { describe, expect, it } from 'vitest'
import { btwGeldig, emailGeldig, ibanGeldig, kvkGeldig } from './bedrijf'

describe('bedrijfsgegevens controleren', () => {
  it('IBAN met mod-97', () => {
    expect(ibanGeldig('NL91 ABNA 0417 1643 00')).toBe(true)
    expect(ibanGeldig('nl91abna0417164300')).toBe(true)
    expect(ibanGeldig('NL91 ABNA 0417 1643 01')).toBe(false)
    expect(ibanGeldig('NL91ABNA041716430')).toBe(false)
    expect(ibanGeldig('')).toBe(true)
  })
  it('e-mail, KvK en btw', () => {
    expect(emailGeldig('info@bedrijf.nl')).toBe(true)
    expect(emailGeldig('info@bedrijf')).toBe(false)
    expect(kvkGeldig('1234 5678')).toBe(true)
    expect(kvkGeldig('1234567')).toBe(false)
    expect(btwGeldig('NL123456789B01')).toBe(true)
    expect(btwGeldig('NL 1234.56.789.B01')).toBe(true)
    expect(btwGeldig('NL123456789')).toBe(false)
  })
})
