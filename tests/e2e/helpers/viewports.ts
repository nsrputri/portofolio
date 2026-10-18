/**
 * Windows the first screen is checked in. The cover with all four closed folder tabs has to fit each
 * of them without scrolling. The short ones are the common screens once the browser's own bars have
 * taken their 110-130px: a 1366x768 laptop, a 1920x1080 one at 125% scaling (1536x864), and phones.
 */
export const FIRST_SCREENS = [
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 360, height: 780 },
  { width: 1366, height: 657 },
  { width: 1280, height: 650 },
  { width: 1536, height: 730 },
  { width: 1024, height: 640 },
  { width: 390, height: 664 },
] as const;

/** Too short for the closed folders as well: only the name, the CV button and the status must be on screen. */
export const KEY_INFO_ONLY = [{ width: 360, height: 640 }] as const;
