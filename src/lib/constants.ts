/** Career start date, used to compute years of experience. */
export const CAREER_START = new Date("2020-09-01");

/** Milliseconds in one average year (accounts for leap years). */
export const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Cache duration for the PDF CV endpoint, in seconds (24h). */
export const CV_CACHE_MAX_AGE = 86400;
