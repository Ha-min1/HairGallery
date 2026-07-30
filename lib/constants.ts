/**
 * Application Constants
 */

/**
 * Official Site Base URL / Address
 * Default: https://hairgallery-9wn.pages.dev
 * Can be overridden via NEXT_PUBLIC_SITE_URL environment variable.
 */
export const OUR_SITE_ADDRESS = (() => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !envUrl.includes('hairgallery.com')) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://hairgallery-9wn.pages.dev';
})();
