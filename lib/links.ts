const UTM = "utm_source=streamroll&utm_medium=app&utm_campaign=devrel";

export const LINKS = {
  runwaySignup:    `https://dev.runwayml.com?${UTM}`,
  runwayApiKeys:   `https://dev.runwayml.com/settings/api-keys?${UTM}`,
  runwayDocs:      `https://docs.dev.runwayml.com?${UTM}`,
  runwayPricing:   `https://docs.dev.runwayml.com/guides/pricing/?${UTM}`,
  runwaySDK:       `https://docs.dev.runwayml.com/api-details/sdks/?${UTM}`,
  runwayGitHub:    `https://github.com/runwayml/sdk-node`,
  runwayCommunity: `https://discord.gg/runwayml`,
  prerollSub:      `https://www.reddit.com/r/plexprerolls/`,
  plexSub:         `https://www.reddit.com/r/PleX/`,
  jellyfinSub:     `https://www.reddit.com/r/jellyfin/`,
  plexForums:      `https://forums.plex.tv/`,
  repoGitHub:      `https://github.com/JoeKarlsson/streamroll`,
} as const;

// Personal branding
export const BUILDER = {
  name:     "Joe Karlsson",
  website:  "https://www.joekarlsson.com",
  twitter:  "https://twitter.com/joekarlsson1",
  github:   "https://github.com/joekarlsson",
  linkedin: "https://linkedin.com/in/joekarlsson",
} as const;

export function tweetShareUrl(serviceName: string, appUrl = "https://streamroll.vercel.app") {
  const text = `Just made my ${serviceName} streaming intro with @runwayml in 30 seconds ✨\n\nTry it yourself →`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}&hashtags=RunwayML,AI,Plex`;
}

export function redditShareUrl(serviceName: string) {
  const title = `Made a custom ${serviceName} streaming pre-roll with AI in ~30 seconds (StreamRoll + Runway)`;
  return `https://www.reddit.com/r/plexprerolls/submit?title=${encodeURIComponent(title)}&type=self`;
}
