import { describe, expect, it, vi } from 'vitest'
import { actieveAi, AiFout, analyseer, foutVoorStatus, maakVerzoek, parseAnalyse, standaardAiInstellingen, tekstUitAntwoord, vindJson } from './ai'

const beeld = { mime: 'image/jpeg', data: 'QUJD' }
const gemini = actieveAi({ ...standaardAiInstellingen(), sleutels: { gemini: 'g-sleutel' } })!
const openai = actieveAi({ ...standaardAiInstellingen(), provider: 'openai', sleutels: { openai: 'sk-test' } })!

const geldig = {
  ruimte: 'badkamer',
  elementen: [
    { type: 'bad', aantal: 1, toelichting: 'Ligbad links', zekerheid: 0.9 },
    { type: 'wandtegels', aantal: 1, toelichting: 'Wit 15x15', zekerheid: 'hoog' },
    { type: 'jacuzzi', aantal: 1 },
  ],
  werkzaamheden: [
    { key: 'sloopwerk', reden: 'Oude tegels', zekerheid: 85 },
    { key: 'Inloopdouche', reden: 'Bad vervangen' },
    { key: 'zwembad', reden: 'onzin' },
    'kitwerk',
  ],
  afmetingen: {
    lengte: { waarde: 2.8, zekerheid: 0.4, toelichting: 'Op basis van deur' },
    breedte: { waarde: '210 cm', zekerheid: 0.3 },
    hoogte: { waarde: 12, zekerheid: 0.9 },
  },
  opmerkingen: ['Let op vochtplek bij plafond', 42],
}

describe('AI-instellingen', () => {
  it('Gemini is standaard en vereist een sleutel', () => {
    expect(standaardAiInstellingen().provider).toBe('gemini')
    expect(actieveAi(standaardAiInstellingen())).toBeNull()
    expect(gemini.model).toBe('gemini-2.5-flash')
  })
  it('eigen provider heeft basis-URL en model nodig', () => {
    const i = { ...standaardAiInstellingen(), provider: 'eigen' as const, sleutels: { eigen: 'x' } }
    expect(actieveAi(i)).toBeNull()
    const a = actieveAi({ ...i, baseUrl: 'https://voorbeeld.nl/v1/', modellen: { eigen: 'llava' } })!
    expect(a.baseUrl).toBe('https://voorbeeld.nl/v1')
  })
})

describe('maakVerzoek', () => {
  it('Gemini: native generateContent met inline afbeelding en JSON-uitvoer', () => {
    const v = maakVerzoek(gemini, [beeld], 'badkamer')
    expect(v.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent')
    expect(v.init.headers['x-goog-api-key']).toBe('g-sleutel')
    expect(v.init.headers.authorization).toBeUndefined()
    const body = JSON.parse(v.init.body)
    expect(body.generationConfig.responseMimeType).toBe('application/json')
    expect(body.contents[0].parts[1]).toEqual({ inline_data: { mime_type: 'image/jpeg', data: 'QUJD' } })
    expect(body.systemInstruction.parts[0].text).toContain('JSON')
  })
  it('OpenAI: chat/completions met data-URL en Bearer-sleutel', () => {
    const v = maakVerzoek(openai, [beeld, beeld], 'keuken')
    expect(v.url).toBe('https://api.openai.com/v1/chat/completions')
    expect(v.init.headers.authorization).toBe('Bearer sk-test')
    const body = JSON.parse(v.init.body)
    expect(body.model).toBe('gpt-4o-mini')
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(body.messages[1].content).toHaveLength(3)
    expect(body.messages[1].content[1].image_url.url).toBe('data:image/jpeg;base64,QUJD')
    expect(body.messages[1].content[0].text).toContain('keuken')
  })
  it('laat temperature weg bij redeneermodellen', () => {
    const v = maakVerzoek({ ...openai, model: 'gpt-5-mini' }, [beeld], 'toilet')
    expect(JSON.parse(v.init.body).temperature).toBeUndefined()
  })
})

describe('parseAnalyse', () => {
  it('schoont een geldig antwoord op', () => {
    const a = parseAnalyse(JSON.stringify(geldig))
    expect(a.ruimte).toBe('badkamer')
    expect(a.elementen.map((e) => e.type)).toEqual(['bad', 'wandtegels'])
    expect(a.elementen[1].zekerheid).toBe(0.8)
    expect(a.werkzaamheden.map((w) => w.key)).toEqual(['sloopwerk', 'inloopdouche', 'kitwerk'])
    expect(a.werkzaamheden[0].zekerheid).toBe(0.85)
    expect(a.afmetingen.lengte).toEqual({ waarde: 2.8, zekerheid: 0.4, toelichting: 'Op basis van deur' })
    expect(a.afmetingen.breedte?.waarde).toBe(2.1)
    expect(a.afmetingen.hoogte).toBeUndefined() // 12 m is onrealistisch
    expect(a.opmerkingen).toEqual(['Let op vochtplek bij plafond'])
  })
  it('leest JSON binnen ```json-blokken en met tekst eromheen', () => {
    expect(parseAnalyse('```json\n{"ruimte":"toilet"}\n```').ruimte).toBe('toilet')
    expect(parseAnalyse('Hier is het resultaat: {"ruimte":"keuken","elementen":[]} Succes!').ruimte).toBe('keuken')
    expect(vindJson('{"a":1}')).toEqual({ a: 1 })
  })
  it('geeft een Nederlandse fout bij onzin', () => {
    expect(() => parseAnalyse('Sorry, ik kan dit niet.')).toThrow(AiFout)
    expect(() => parseAnalyse('Sorry, ik kan dit niet.')).toThrow(/geen leesbare JSON/)
    expect(() => parseAnalyse('[1,2]')).toThrow(/verwachte vorm/)
  })
  it('verdraagt ontbrekende velden', () => {
    const a = parseAnalyse('{}')
    expect(a).toEqual({ ruimte: undefined, elementen: [], werkzaamheden: [], afmetingen: {}, opmerkingen: [] })
  })
})

describe('antwoorden en fouten', () => {
  it('haalt tekst uit Gemini- en OpenAI-antwoorden', () => {
    expect(tekstUitAntwoord('gemini', { candidates: [{ content: { parts: [{ text: '{"a"' }, { text: ':1}' }] } }] })).toBe('{"a":1}')
    expect(tekstUitAntwoord('openai', { choices: [{ message: { content: '{}' } }] })).toBe('{}')
    expect(() => tekstUitAntwoord('gemini', { promptFeedback: { blockReason: 'SAFETY' } })).toThrow(/geweigerd/)
    expect(() => tekstUitAntwoord('openai', {})).toThrow(/leeg antwoord/)
  })
  it('vertaalt HTTP-fouten', () => {
    expect(foutVoorStatus(429, '', 'gemini').message).toMatch(/gratis limiet van Gemini/)
    expect(foutVoorStatus(429, '', 'openai').soort).toBe('limiet')
    expect(foutVoorStatus(400, '{"error":{"message":"API key not valid. Please pass a valid API key."}}', 'gemini').soort).toBe('sleutel')
    expect(foutVoorStatus(401, '', 'openai').soort).toBe('sleutel')
    expect(foutVoorStatus(404, '', 'xai').soort).toBe('model')
    expect(foutVoorStatus(503, '', 'xai').soort).toBe('dienst')
  })
})

describe('analyseer', () => {
  const antwoord = (status: number, body: unknown) =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

  it('Gemini: volledige ronde met gemockte fetch', async () => {
    const f = vi.fn().mockResolvedValue(antwoord(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(geldig) }] } }] }))
    const a = await analyseer(gemini, [beeld], 'badkamer', f)
    expect(f).toHaveBeenCalledOnce()
    expect(f.mock.calls[0][0]).toContain(':generateContent')
    expect(a.werkzaamheden).toHaveLength(3)
  })
  it('OpenAI: volledige ronde', async () => {
    const f = vi.fn().mockResolvedValue(antwoord(200, { choices: [{ message: { content: '```json\n{"ruimte":"keuken"}\n```' } }] }))
    expect((await analyseer(openai, [beeld], 'keuken', f)).ruimte).toBe('keuken')
  })
  it('429 geeft een vriendelijke melding', async () => {
    const f = vi.fn().mockResolvedValue(antwoord(429, { error: { status: 'RESOURCE_EXHAUSTED' } }))
    await expect(analyseer(gemini, [beeld], 'badkamer', f)).rejects.toThrow(/Even rustig aan/)
  })
  it('netwerkfout (bijv. offline)', async () => {
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(analyseer(openai, [beeld], 'badkamer', f)).rejects.toThrow(/niet bereiken/)
  })
  it('zonder foto’s geen verzoek', async () => {
    const f = vi.fn()
    await expect(analyseer(gemini, [], 'badkamer', f)).rejects.toThrow(/minstens één foto/)
    expect(f).not.toHaveBeenCalled()
  })
})

describe('testVerbinding', () => {
  it('slaagt bij een geldig antwoord en meldt een ongeldige sleutel', async () => {
    const { testVerbinding } = await import('./ai')
    const ok = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{}' }] } }] })))
    await expect(testVerbinding(gemini, ok)).resolves.toBeUndefined()
    const fout = vi.fn().mockResolvedValue(new Response('{"error":{"message":"API key not valid"}}', { status: 400 }))
    await expect(testVerbinding(gemini, fout)).rejects.toThrow(/niet geaccepteerd/)
  })
})
