/**
 * Field guide — editorial content for the island panels.
 *
 * Keyed by the category ids the registry already knows (src/lib/categories.ts).
 * A category without an entry still gets a useful panel built only from API
 * data (question counts per tier); nothing is invented for it.
 *
 * Every `fact` is a standard reference fact with a public source link. These
 * were written from established textbook knowledge; the links were NOT
 * re-opened from the build environment (its network is restricted), so please
 * spot-check before publishing and delete any entry you cannot confirm — the
 * panel degrades gracefully to a category-only view.
 */
export interface FieldGuideEntry {
  /** one or two sentences: what this field is about */
  summary: string
  fact: {
    /** the concept / person / turning point */
    title: string
    /** what happened, briefly */
    text: string
    /** why it still matters */
    why: string
    source: { label: string; url: string }
  }
}

const WIKI = (slug: string) => ({ label: 'Wikipedia', url: `https://en.wikipedia.org/wiki/${slug}` })

const ENTRIES: Record<string, FieldGuideEntry> = {
  maths: {
    summary: 'The study of number, shape, structure and change — and of what can be proved about them.',
    fact: {
      title: 'Euclid’s Elements, c. 300 BC',
      text: 'Euclid organised geometry as a chain of theorems proved from a handful of stated definitions, postulates and common notions.',
      why: 'That axiomatic method — assume little, prove everything else — is still how mathematics is built and checked today.',
      source: WIKI('Euclid%27s_Elements'),
    },
  },
  science: {
    summary: 'A method before it is a subject: observe, hypothesise, test, and let evidence overrule authority.',
    fact: {
      title: 'The Royal Society’s motto, 1660s',
      text: 'The Royal Society of London adopted the motto Nullius in verba — “take nobody’s word for it”.',
      why: 'It captures the turn from trusting ancient texts to demanding repeatable experiment, the habit every scientific field inherits.',
      source: WIKI('Royal_Society'),
    },
  },
  technology: {
    summary: 'Applied knowledge: the tools, systems and networks that extend what people can do.',
    fact: {
      title: 'The World Wide Web, 1989',
      text: 'Tim Berners-Lee proposed the World Wide Web while working at CERN, combining hypertext with the Internet.',
      why: 'It turned a research network into a public medium — the reason a quiz can be scored on a server and read anywhere.',
      source: WIKI('World_Wide_Web'),
    },
  },
  python: {
    summary: 'A readable, general-purpose programming language used for scripting, data work, the web and teaching.',
    fact: {
      title: 'Guido van Rossum, first release 1991',
      text: 'Python was created by Guido van Rossum; its first public release appeared in 1991.',
      why: 'Its emphasis on readable code made programming approachable — VEYRA’s own scoring engine is written in it.',
      source: WIKI('Python_(programming_language)'),
    },
  },
  computer_science: {
    summary: 'What can be computed, how efficiently, and how to express it precisely enough for a machine.',
    fact: {
      title: 'Alan Turing’s “On Computable Numbers”, 1936',
      text: 'Turing described an abstract machine that reads and writes symbols on a tape, and showed some problems no such machine can decide.',
      why: 'The Turing machine is the reference model for every computer since — and the limits he proved still hold.',
      source: WIKI('Turing_machine'),
    },
  },
  physics: {
    summary: 'Matter, energy, motion and the forces between them, from particles to galaxies.',
    fact: {
      title: 'Newton’s Principia, 1687',
      text: 'Philosophiæ Naturalis Principia Mathematica set out the laws of motion and universal gravitation.',
      why: 'One set of laws explained falling apples and orbiting planets alike — the template for a unified physical theory.',
      source: WIKI('Philosophi%C3%A6_Naturalis_Principia_Mathematica'),
    },
  },
  chemistry: {
    summary: 'Substances, their structure and the reactions that transform one into another.',
    fact: {
      title: 'Mendeleev’s periodic table, 1869',
      text: 'Dmitri Mendeleev arranged the known elements by atomic weight and chemical behaviour, leaving gaps for elements not yet found.',
      why: 'The gaps were later filled by real discoveries — a table that predicted nature rather than merely listing it.',
      source: WIKI('Periodic_table'),
    },
  },
  biology: {
    summary: 'Living things: cells, organisms, inheritance, ecosystems and how they change over time.',
    fact: {
      title: 'Darwin’s On the Origin of Species, 1859',
      text: 'Charles Darwin argued that species change through natural selection acting on inherited variation.',
      why: 'Evolution is the frame that makes the rest of biology — from antibiotics to genomes — make sense.',
      source: WIKI('On_the_Origin_of_Species'),
    },
  },
  astronomy_space: {
    summary: 'Planets, stars, galaxies and the universe as a whole — observed, measured and modelled.',
    fact: {
      title: 'Hubble’s law, 1929',
      text: 'Edwin Hubble reported that distant galaxies recede faster the farther away they are.',
      why: 'An expanding universe followed — the observational root of modern cosmology and the Big Bang model.',
      source: WIKI('Hubble%27s_law'),
    },
  },
  geography: {
    summary: 'Places and the relationships between people, environment and space on the Earth’s surface.',
    fact: {
      title: 'Eratosthenes measures the Earth, c. 240 BC',
      text: 'Comparing the Sun’s angle at Syene and Alexandria, Eratosthenes estimated the Earth’s circumference with remarkable accuracy.',
      why: 'Measuring a planet with shadows and geometry is the founding act of scientific geography.',
      source: WIKI('Eratosthenes'),
    },
  },
  history: {
    summary: 'The study of the human past through evidence — and of how that evidence is weighed.',
    fact: {
      title: 'Herodotus’ Histories, 5th century BC',
      text: 'Herodotus set out to record the causes of the Greco-Persian Wars by collecting and comparing accounts; Cicero later called him “the father of history”.',
      why: 'Asking why events happened, and citing sources for the answer, is still the historian’s basic move.',
      source: WIKI('Herodotus'),
    },
  },
  economics_business: {
    summary: 'How people, firms and nations produce, trade and allocate scarce resources.',
    fact: {
      title: 'Adam Smith’s The Wealth of Nations, 1776',
      text: 'Smith described how the division of labour and market exchange raise productivity across a whole economy.',
      why: 'It framed economics as a system to be analysed rather than a set of royal accounts — the start of the modern discipline.',
      source: WIKI('The_Wealth_of_Nations'),
    },
  },
  logic_reasoning: {
    summary: 'Valid inference: what follows from what, and how to tell a sound argument from a persuasive one.',
    fact: {
      title: 'George Boole’s The Laws of Thought, 1854',
      text: 'Boole showed that logical reasoning could be written and manipulated as algebra.',
      why: 'Boolean algebra became the mathematics of every digital circuit and every search query.',
      source: WIKI('The_Laws_of_Thought'),
    },
  },
  english_language: {
    summary: 'Words, grammar, meaning and style — how English works and how it is used well.',
    fact: {
      title: 'Johnson’s Dictionary, 1755',
      text: 'Samuel Johnson’s A Dictionary of the English Language defined words with quotations showing real usage.',
      why: 'It set the standard that a dictionary should describe the language as actually written, not merely prescribe it.',
      source: WIKI('A_Dictionary_of_the_English_Language'),
    },
  },
  general_knowledge: {
    summary: 'The wide, connected layer of facts a curious person carries across every other field.',
    fact: {
      title: 'The Encyclopédie, 1751–1772',
      text: 'Edited by Diderot and d’Alembert, the Encyclopédie gathered the knowledge of its age into one cross-referenced work.',
      why: 'The idea that all fields can be mapped and linked — the idea behind this archipelago — starts there.',
      source: WIKI('Encyclop%C3%A9die'),
    },
  },
}

// aliases the registry also recognises
const ALIAS: Record<string, string> = {
  math: 'maths',
  mathematics: 'maths',
  python_programming: 'python',
  astronomy: 'astronomy_space',
  economics: 'economics_business',
  logic: 'logic_reasoning',
  english: 'english_language',
  general: 'general_knowledge',
}

export function fieldGuide(id: string): FieldGuideEntry | null {
  return ENTRIES[id] ?? ENTRIES[ALIAS[id] ?? ''] ?? null
}
