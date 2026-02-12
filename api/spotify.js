const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

async function getAccessToken() {
  return fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    }),
  });
}

export default async function handler(req, res) {
  const { access_token } = await getAccessToken().then(res => res.json());

  const response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (response.status === 204 || response.status > 400) {
    return res.status(200).send("Not playing anything right now");
  }

  const song = await response.json();

  const title = song.item.name;
  const artist = song.item.artists.map(a => a.name).join(", ");
  const cover = song.item.album.images[0].url;

  const svg = `
  <svg width="600" height="180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffe4ec"/>
        <stop offset="100%" stop-color="#f8c8dc"/>
      </linearGradient>
    </defs>

    <rect width="600" height="180" rx="20" fill="url(#bg)" />

    <image href="${cover}" x="20" y="20" width="140" height="140" rx="15"/>

    <text x="190" y="80" font-size="28" font-family="Verdana" fill="#6a1b4d" font-weight="bold">
      ${title}
    </text>

    <text x="190" y="115" font-size="20" font-family="Verdana" fill="#9c4a73">
      ${artist}
    </text>

    <text x="190" y="150" font-size="16" font-family="Verdana" fill="#b76e91">
      🎧 Now Playing
    </text>
  </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.status(200).send(svg);
}
