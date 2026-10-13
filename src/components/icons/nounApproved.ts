/*
  Noun Project icons are only shown for keys listed here.

  scripts/fetch-noun-icons.mjs takes the FIRST search result for every term, which is
  often the wrong picture or a solid style that clashes with the clean line icons used
  across ZieAds. So a fetched icon stays hidden until someone has looked at it in
  public/noun/<key>.png and added its key below. Everything else uses the lucide line icon.

  Example: export const NOUN_APPROVED = new Set<string>(['ui-insight', 'founder']);
*/
export const NOUN_APPROVED = new Set<string>([]);
