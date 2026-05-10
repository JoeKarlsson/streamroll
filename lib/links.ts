const UTM = "utm_source=streamroll&utm_medium=app&utm_campaign=devrel";

export const LINKS = {
  runwaySignup:    `https://dev.runwayml.com?${UTM}`,
  runwayApiKeys:   `https://dev.runwayml.com/settings/api-keys?${UTM}`,
  runwayDocs:      `https://docs.dev.runwayml.com?${UTM}`,
  runwayPricing:   `https://docs.dev.runwayml.com/guides/pricing/?${UTM}`,
  runwaySDK:       `https://docs.dev.runwayml.com/api-details/sdks/?${UTM}`,
  runwayGitHub:    `https://github.com/runwayml/sdk-node`,
  runwayCommunity: `https://discord.gg/runwayml`,
} as const;

// Personal branding
export const BUILDER = {
  name:     "Joe Karlsson",
  twitter:  "https://twitter.com/joekarlsson1",
  github:   "https://github.com/joekarlsson",
  linkedin: "https://linkedin.com/in/joekarlsson",
} as const;

export function tweetShareUrl(serviceName: string, appUrl = "https://streamroll.vercel.app") {
  const text = `Just made my ${serviceName} streaming intro with @runwayml in 30 seconds ✨\n\nTry it yourself →`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}&hashtags=RunwayML,AI,Plex`;
}
