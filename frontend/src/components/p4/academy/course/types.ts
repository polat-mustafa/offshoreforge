/**
 * Shape of the AI Academy course: parts → chapters → sections → blocks.
 *
 * Every string the reader sees is bilingual (T). Prose is "rich text" with a small
 * markup that the renderer (ui/RichText) understands:
 *
 *   [@key] or [@a;@b]   numbered citation of refs.ts entries (IEEE style, per chapter)
 *   $…$                 inline maths (KaTeX)
 *   **…**               emphasis
 *   `…`                 code, file names, parameters
 *   {fact}              a number from the platform's own result (course/facts.ts),
 *                       formatted for the reading language
 */

export type Lang = "en" | "tr";
export type T = Record<Lang, string>;

export type PartId = "problem" | "learning" | "models" | "uncertainty" | "operation";

export interface Part {
  id: PartId;
  /** Roman numeral shown in the table of contents. */
  numeral: string;
  title: T;
}

/** A row of the symbol table under an equation. */
export interface EqSymbol {
  sym: string; // TeX
  def: T;
  unit?: string;
}

export type CalloutTone = "example" | "pitfall" | "note" | "history";

export type Block =
  | { kind: "p"; text: T }
  | { kind: "eq"; tex: string; where?: EqSymbol[]; source?: string }
  | { kind: "fig"; fig: string; caption: T; source?: T; wide?: boolean }
  | { kind: "callout"; tone: CalloutTone; title: T; body: T[] }
  | { kind: "list"; ordered?: boolean; items: T[] }
  | { kind: "table"; caption: T; head: T[]; rows: T[][]; source?: T }
  | { kind: "steps"; title: T; given: T; steps: T[]; result: T }
  | { kind: "code"; caption: T; file: string; symbol?: string; code: string };

export interface Section {
  id: string;
  title: T;
  blocks: Block[];
}

export interface QuizItem {
  q: T;
  options: T[];
  answer: number;
  why: T;
}

/** "From theory to practice": the same four questions answered in every chapter. */
export interface Practice {
  /** How this platform uses it — with the files that implement it. */
  platform: T[];
  files: string[];
  /** Where it is used in the energy industry and beyond. */
  industry: T[];
  /** The problem it solves. */
  solves: T[];
  /** Where it fails or what it costs. */
  limits: T[];
}

export interface Chapter {
  id: string;
  n: number;
  part: PartId;
  title: T;
  /** Abstract: one paragraph that says what the chapter answers. */
  lead: T;
  objectives: T[];
  sections: Section[];
  practice: Practice;
  takeaways: T[];
  quiz: QuizItem[];
  /** Concept-map node ids this chapter explains. */
  concepts: string[];
}

export interface Reference {
  /** "A. Author, B. Author" (IEEE: initials first). */
  authors: string;
  year: number;
  title: string;
  /** Journal / proceedings / publisher, with volume and pages where known. */
  venue: string;
  doi?: string;
  url?: string;
}
