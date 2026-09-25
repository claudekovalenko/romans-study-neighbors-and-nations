// Turns pasted share links into embeddable players.

export function videoEmbed(url) {
  if (!url) return null;
  let m;
  if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/))) {
    return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${m[1]}` };
  }
  if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
    return { type: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` };
  }
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) {
    return { type: 'video', src: url };
  }
  return { type: 'link', src: url };
}

export function spotifyEmbed(url) {
  if (!url) return null;
  const m = url.match(/open\.spotify\.com\/(?:embed\/)?(episode|show)\/([A-Za-z0-9]+)/);
  if (!m) return null;
  return { kind: m[1], src: `https://open.spotify.com/embed/${m[1]}/${m[2]}` };
}
