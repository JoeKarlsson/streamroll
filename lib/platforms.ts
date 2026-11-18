export const PLATFORMS = [
  {
    name: "Plex", slug: "plex", color: "#EBAF00",
    howTo: "Settings → Extras → Cinema Trailers → enable pre-roll, then drop the .mp4 into your Extras folder.",
    docs: "https://support.plex.tv/articles/202934883-cinema-trailers-extras/",
  },
  {
    name: "Jellyfin", slug: "jellyfin", color: "#00A4DC",
    howTo: "Jellyfin has no built-in pre-roll; install an intros plugin from Dashboard → Plugins → Catalog.",
    docs: "https://jellyfin.org/docs/general/server/plugins/",
  },
  {
    name: "Emby", slug: "emby", color: "#52B54B",
    howTo: "Server Settings → Pre-Roll Videos → add the .mp4 file.",
    docs: "https://emby.media/community/index.php?/topic/86649-pre-roll-videos/",
  },
];
