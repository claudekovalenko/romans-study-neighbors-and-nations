// App-wide settings. Series content lives in /series — see README.md.
export const config = {
  appName: 'Sermon Series',
  church: 'Neighbors and Nations Church',

  // Lists every series and which one opens by default.
  seriesIndex: './series/index.json',

  // Scripture text comes from the ESV API (https://api.esv.org).
  // Use ONE of these:
  //   proxyUrl — recommended. A tiny server function that holds your key
  //              (see server/esv-proxy.worker.js). Key stays private.
  //   apiKey   — quickest to set up, but the key is visible to anyone
  //              who views the site source.
  // With neither set, the reader links out to esv.org instead.
  esv: {
    proxyUrl: '',
    apiKey: '',
  },
};
