/**
 * Name of the Cache API bucket that holds pronunciation clips.
 *
 * The service worker, the player and the "Download all audio" control must agree
 * on this value. Bump the version whenever the audio library is replaced so
 * devices drop stale clips instead of serving them for a year.
 */
export const AUDIO_CACHE_NAME = "goyo-audio-v4";
