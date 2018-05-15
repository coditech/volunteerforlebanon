const TRIM = /^\s+|\s+$/g;
const INVALID = /[^a-z0-9 -_]/g;
const WHITESPACE = /\s+/g;
const DASHES = /-+/g;

/**
 * Converts a string to a safe string,
 * suitable to be used as an url
 * or as an html element class/id
 * @param str 
 */
export const slugify = 
  (str) =>
  str
    .toLowerCase()
    .replace(TRIM, '')
    .replace(INVALID, '')
    .replace(WHITESPACE, '_')
    .replace(DASHES, '-');

export default slugify