/**
 * EXHIBITS — the small museum worlds behind clickable islands.
 *
 * One exhibit per category id *as the API reports it* (`maths`, `python`),
 * each telling one verified turning point in three beats: what came before,
 * the breakthrough, what changed afterward. Every statement below is taken
 * from the cited pages (read 2026-10-14):
 *   maths  — MacTutor, "A history of Zero" and the Brahmagupta biography (O'Connor & Robertson)
 *   python — docs.python.org, "General Python FAQ"
 * Nothing is claimed beyond what those pages say; where the source itself is
 * cautious (no single inventor of zero; "probably millions" of users) the
 * exhibit stays cautious too.
 *
 * Adding a category later = adding an entry here (+ an optional diorama kind
 * in the scene). Islands without an entry keep the plain field guide.
 */

export type BeatKey = 'before' | 'breakthrough' | 'after'

export interface Beat {
  key: BeatKey
  /** short label on the stepper */
  label: string
  /** when */
  when: string
  title: string
  text: string
}

export interface Source {
  label: string
  url: string
}

export interface Exhibit {
  /** category id as returned by GET /api/categories */
  id: string
  /** exhibit name on the plaque */
  title: string
  subtitle: string
  beats: [Beat, Beat, Beat]
  why: string
  sources: Source[]
  /** which 3D / SVG diorama to draw */
  diorama: 'zero' | 'python'
}

const EXHIBITS: Record<string, Exhibit> = {
  maths: {
    id: 'maths',
    title: 'Zero becomes a number',
    subtitle: 'From an empty place to something arithmetic can act on',
    diorama: 'zero',
    beats: [
      {
        key: 'before',
        label: 'Before',
        when: 'c. 1700 BC – AD 130',
        title: 'Place value, with a gap',
        text:
          'Babylonian scribes kept a base-60 place-value system for over a thousand years with no sign for an empty place; the context had to tell 216 from 2106. Around 400 BC two slanted wedges began to mark an empty place — but only between digits, never at the end. Greek astronomers, and Ptolemy in the Almagest around AD 130, used the symbol O as a placeholder: a kind of punctuation, not a number.',
      },
      {
        key: 'breakthrough',
        label: 'Breakthrough',
        when: 'AD 628, India',
        title: 'Brahmagupta writes rules for zero',
        text:
          'In the Brahmasphutasiddhanta, written in 628, Brahmagupta set out how zero and negative numbers behave under arithmetic: a number subtracted from itself gives zero; zero added to a positive number is positive; any number multiplied by zero is zero. He struggled with division — his claim that zero divided by zero is zero is wrong — but MacTutor calls it “a brilliant attempt from the first person that we know who tried to extend arithmetic to negative numbers and zero.” The earliest dated Indian inscription using zero that all historians accept is at Gwalior, from 876.',
      },
      {
        key: 'after',
        label: 'After',
        when: '9th – 17th century',
        title: 'Ten digits travel',
        text:
          'Al-Khwarizmi described the Indian system of 1–9 and 0 in his book on the Hindu art of reckoning. Around 1200 Fibonacci’s Liber Abaci brought the nine Indian symbols and “the sign 0” to Europe — he still spoke of zero as a sign rather than a number, and it was not widely used for a long time. Cardan solved cubic equations in the 1500s without it; zero came into widespread use only in the 1600s, and after much resistance.',
      },
    ],
    why:
      'This is the move from a notational trick to a number that arithmetic acts on — the step that makes negative numbers, and the abstract idea of number itself, workable. MacTutor is careful to say there was no single inventor and no single moment: zero “makes shadowy appearances only to vanish again”, and the Maya developed a zero independently. The exhibit follows that caution.',
    sources: [
      { label: 'MacTutor — A history of Zero (University of St Andrews)', url: 'https://mathshistory.st-andrews.ac.uk/HistTopics/Zero/' },
      { label: 'MacTutor — Brahmagupta', url: 'https://mathshistory.st-andrews.ac.uk/Biographies/Brahmagupta/' },
      { label: 'MacTutor — Fibonacci', url: 'https://mathshistory.st-andrews.ac.uk/Biographies/Fibonacci/' },
    ],
  },
  python: {
    id: 'python',
    title: 'A language for the holidays',
    subtitle: 'Why Python was created, in its author’s words',
    diorama: 'python',
    beats: [
      {
        key: 'before',
        label: 'Before',
        when: '1980s, CWI Amsterdam',
        title: 'ABC could not be extended',
        text:
          'Guido van Rossum had helped implement the ABC language at CWI — the origin of Python’s indentation for grouping statements and its very-high-level data types. He liked much of ABC but it was impossible to extend, which he calls one of its biggest problems. Meanwhile, in the Amoeba distributed operating-system group, system administration meant writing C programs or Bourne shell scripts, and Amoeba’s own system calls were not easily reached from the shell.',
      },
      {
        key: 'breakthrough',
        label: 'Breakthrough',
        when: 'Christmas 1989',
        title: '“I decided to give it a try”',
        text:
          '“It occurred to me that a scripting language with a syntax like ABC but with access to the Amoeba system calls would fill the need. I realized that it would be foolish to write an Amoeba-specific language, so I decided that I needed a language that was generally extensible. During the 1989 Christmas holidays, I had a lot of time on my hand, so I decided to give it a try.” Exceptions came from Modula-3; the name came from the published scripts of Monty Python’s Flying Circus — short, unique, slightly mysterious.',
      },
      {
        key: 'after',
        label: 'After',
        when: 'February 1991 →',
        title: 'Posted to USENET',
        text:
          'Through 1990 Python was used in the Amoeba project with increasing success, mostly developed in van Rossum’s own time, and feedback from colleagues shaped early improvements. In February 1991, after just over a year, he posted it to USENET. New stable releases have come out roughly every 6 to 18 months since; from version 3.9 there is one feature release a year. Python 2 is no longer maintained.',
      },
    ],
    why:
      'The thing ABC could not do — be extended — became Python’s founding requirement. That is why it can be extended in C or C++, embedded in other applications, and why its standard library grew so wide. The official FAQ says it is a good first language because its simple, consistent syntax lets beginners concentrate on decomposing problems. It puts the user count at “probably millions” and says an exact figure is hard to obtain — so this exhibit gives no number.',
    sources: [
      { label: 'Python FAQ — Why was Python created in the first place?', url: 'https://docs.python.org/3/faq/general.html#why-was-python-created-in-the-first-place' },
      { label: 'Python FAQ — Why is it called Python?', url: 'https://docs.python.org/3/faq/general.html#why-is-it-called-python' },
      { label: 'Python FAQ — How stable is Python?', url: 'https://docs.python.org/3/faq/general.html#how-stable-is-python' },
      { label: 'CWI — first published article on Python (1991)', url: 'https://ir.cwi.nl/pub/18204' },
    ],
  },
}

const ALIASES: Record<string, string> = { math: 'maths', mathematics: 'maths' }

export function exhibitFor(id: string | null | undefined): Exhibit | null {
  if (!id) return null
  return EXHIBITS[id] ?? EXHIBITS[ALIASES[id] ?? ''] ?? null
}
export function hasExhibit(id: string | null | undefined): boolean {
  return !!exhibitFor(id)
}
