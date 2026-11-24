/** A text in one language, as profiles, vocabularies and metadata values hold it. */
export interface LanguageText {
  lang: string;
  value: string;
}

/**
 * The forms a text arrives in: a list per language (profiles, metadata values), an object keyed by
 * language (a vocabulary's `prefLabel` and `title`), a single text, or a plain string.
 */
export type LanguageTexts = LanguageText[] | LanguageText | Record<string, string> | string | null | undefined;

function isLanguageText(texts: object): texts is LanguageText {
  return 'value' in texts && 'lang' in texts;
}

/** Every text with its language, whatever form it arrives in. A plain string has no language. */
export function toLanguageTexts(texts: LanguageTexts): LanguageText[] {
  if (!texts) return [];
  if (typeof texts === 'string') return [{ lang: '', value: texts }];
  if (Array.isArray(texts)) return texts.filter(text => !!text);
  if (isLanguageText(texts)) return [texts];
  return Object.entries(texts).map(([lang, value]) => ({ lang, value }));
}

/**
 * The text in the language asked for, else the first one there is. The host translates no metadata:
 * it passes its language, and metadata without that language stay in the language they bring.
 */
export function pickText(texts: LanguageTexts, language: string): string {
  const list = toLanguageTexts(texts);
  if (!list.length) return '';
  return (list.find(text => text.lang === language) ?? list[0]).value ?? '';
}
