/**
 * Display-only repair for "mojibake" — UTF-8 text that was once decoded as
 * Windows-1252 (e.g. "âˆ«" instead of "∫"). The raw string from the engine is
 * never altered or sent back; this is purely for rendering.
 */
const CP1252: Record<string, number> = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88,
  '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93,
  '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b,
  'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
}

const SUSPECT = /[\u00C2-\u00F4](?=[\u0080-\u00BF\u0152-\u0192\u02C6\u02DC\u2013-\u2122])/
const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: true }) : null

export function repairText(input: string | null | undefined): string {
  if (!input || !decoder || !SUSPECT.test(input)) return input ?? ''
  const bytes: number[] = []
  for (const ch of input) {
    const code = ch.codePointAt(0)!
    if (code <= 0xff) bytes.push(code)
    else if (ch in CP1252) bytes.push(CP1252[ch])
    else return input
  }
  try {
    return decoder.decode(new Uint8Array(bytes))
  } catch {
    return input
  }
}
