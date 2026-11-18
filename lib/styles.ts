import type { Duration, ImageModel, Style, Treatment, VideoModel } from "./runway";

// Per-style accent colors used for selected state
export const STYLE_COLOR: Record<Style, string> = {
  cinematic:  "#F59E0B",
  retro:      "#EC4899",
  futuristic: "#06B6D4",
  minimal:    "#E5E7EB",
  horror:     "#EF4444",
  anime:      "#3B82F6",
  epic:       "#F97316",
  nature:     "#22C55E",
  prestige:   "#E50914",
  adultswim:  "#D4D4D4",
  cartoon:    "#EF4444",
  vhs:        "#94A3B8",
  grindhouse: "#EC4899",
  lofi:       "#A78BFA",
  vaporwave:  "#C084FC",
  cyberpunk:  "#F43F5E",
  hbo:         "#A1A1AA",
  blockbuster: "#FFDE00",
  dreamworks:  "#93C5FD",
  tristar:     "#F59E0B",
  hannabarbera:"#A855F7",
  columbia:    "#F5DEB3",
  mst3k:       "#818CF8",
  ebs:         "#22C55E",
};

export const STYLES: { id: Style; label: string; desc: string; tip?: string; image?: string }[] = [
  { id: "prestige",   label: "Netflix",         desc: "Bold red on black",            tip: "Auto: Gen4.5, Minimal, 4s",        image: "/previews/style-prestige.jpg" },
  { id: "cinematic",  label: "Cinematic",       desc: "Navy & gold, film grain",       tip: "Auto: Gen4.5, Full Bleed, 5s",     image: "/previews/style-cinematic.jpg" },
  { id: "retro",      label: "Retro",           desc: "80s neon synthwave",            tip: "Auto: Gen4 Turbo, Full Bleed, 5s", image: "/previews/style-retro.jpg" },
  { id: "futuristic", label: "Futuristic",      desc: "Holographic chrome",            tip: "Auto: Gen4.5, Full Bleed, 5s",     image: "/previews/style-futuristic.jpg" },
  { id: "minimal",    label: "Minimal",          desc: "Clean & elegant",               tip: "Auto: Gen4 Turbo, Minimal, 4s",    image: "/previews/style-minimal.jpg" },
  { id: "horror",     label: "Horror",          desc: "Gothic, fog & shadow",          tip: "Auto: Gen4 Turbo, Theatrical, 5s", image: "/previews/style-horror.jpg" },
  { id: "anime",      label: "Anime",           desc: "Shonen energy burst",           tip: "Auto: Gen4.5, Full Bleed, 4s",     image: "/previews/style-anime.jpg" },
  { id: "adultswim",  label: "Adult Swim",      desc: "Black screen, white text",      tip: "Auto: Gen4 Turbo, Minimal, 2s",    image: "/previews/style-adultswim.jpg" },
  { id: "cartoon",    label: "Cartoon Network", desc: "Checkerboard graphic pop",      tip: "Auto: Gen4 Turbo, Full Bleed, 4s", image: "/previews/style-cartoon.jpg" },
  { id: "vhs",        label: "VHS",             desc: "Tracking errors, tape decay",   tip: "Auto: Gen4 Turbo, Theatrical, 5s", image: "/previews/style-vhs.jpg" },
  { id: "grindhouse", label: "Grindhouse",      desc: "Psychedelic cinema pre-show",   tip: "Auto: Gen4 Turbo, Theatrical, 5s", image: "/previews/style-grindhouse.jpg" },
  { id: "lofi",       label: "Lo-fi",           desc: "Cozy rain, study beats",        tip: "Auto: Gen4 Turbo, Minimal, 4s",    image: "/previews/style-lofi.jpg" },
  { id: "vaporwave",  label: "Vaporwave",       desc: "Pastel grid, marble busts",     tip: "Auto: Gen4.5, Full Bleed, 5s",     image: "/previews/style-vaporwave.jpg" },
  { id: "cyberpunk",  label: "Cyberpunk",       desc: "Neon rain, dark mega-city",     tip: "Auto: Gen4.5, Theatrical, 5s",     image: "/previews/style-cyberpunk.jpg" },
  { id: "hbo",        label: "HBO",             desc: "3D chrome letters, star field", tip: "Auto: Gen4.5, Theatrical, 5s",     image: "/previews/style-hbo.jpg" },
  { id: "epic",       label: "Epic",            desc: "Golden hour, dust",             tip: "Auto: Gen4.5, Theatrical, 5s",     image: "/previews/style-epic.jpg" },
  { id: "nature",     label: "Nature",          desc: "Earthy documentary",            tip: "Auto: Gen4 Turbo, Minimal, 4s",    image: "/previews/style-nature.jpg" },
  { id: "blockbuster",label: "Blockbuster",     desc: "Yellow on navy, video store",   tip: "Auto: Gen4.5, Theatrical, 5s",     image: "/previews/style-blockbuster.jpg" },
];

export const STYLE_DEFAULTS: Record<Style, { videoModel: VideoModel; imageModel: ImageModel; treatment: Treatment; duration: Duration }> = {
  // gen4_image = creative/artistic;  gemini_image3_pro = precise instruction-following
  prestige:   { videoModel: "gen4.5",      imageModel: "gemini_image3_pro", treatment: "minimal",     duration: 4 },
  cinematic:  { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  retro:      { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  futuristic: { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  minimal:    { videoModel: "gen4_turbo",  imageModel: "gemini_image3_pro", treatment: "minimal",     duration: 4 },
  horror:     { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "theatrical",  duration: 5 },
  anime:      { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "full-bleed",  duration: 4 },
  adultswim:  { videoModel: "gen4_turbo",  imageModel: "gemini_image3_pro", treatment: "minimal",     duration: 2 },
  cartoon:    { videoModel: "gen4_turbo",  imageModel: "gemini_image3_pro", treatment: "full-bleed",  duration: 4 },
  vhs:        { videoModel: "gen4_turbo",  imageModel: "gemini_image3_pro", treatment: "theatrical",  duration: 5 },
  grindhouse: { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "theatrical",  duration: 5 },
  lofi:       { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "minimal",     duration: 4 },
  vaporwave:  { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  cyberpunk:  { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "theatrical",  duration: 5 },
  hbo:        { videoModel: "gen4.5",      imageModel: "gemini_image3_pro", treatment: "theatrical",  duration: 5 },
  epic:        { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "theatrical",  duration: 5 },
  nature:      { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "minimal",     duration: 4 },
  blockbuster:  { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "theatrical",  duration: 5 },
  dreamworks:   { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  tristar:      { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  hannabarbera: { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  columbia:     { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  mst3k:        { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  ebs:          { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "full-bleed",  duration: 2 },
};

export const STYLE_TAGLINES: Record<Style, string[]> = {
  prestige:    ["Where stories come alive","Stream like it matters","The next great thing","Your world, your screen","For the discerning viewer","Stories worth watching","Premium starts here","Not all streams are equal","Everything. Anytime.","The future of watching"],
  cinematic:   ["Made for the big moments","Cinema lives here","Film, reimagined","Every frame, a story","The cinematic experience, at home","Gold standard streaming","Drama in every pixel","Where movies breathe","Feel everything","The picture is the message"],
  retro:       ["Totally tubular","Rad to the max","Don't touch that dial","Press play on the past","Rewind and relive","Pop the tape in","Back to the good stuff","Gnarly content ahead","Wicked awesome streaming","Totally radical"],
  futuristic:  ["The future is on","Tomorrow's content today","Streaming from the future","Next-gen entertainment","Beyond what's possible","Interface with tomorrow","Upgrade your reality","The signal from ahead","Neural-linked entertainment","Stream beyond the horizon"],
  minimal:     ["Less is more","Only what matters","Simple. Perfect.","Quiet excellence","Nothing extra","Pure signal, no noise","Refined, always","Curated by intention","The essential cut","Elegance in simplicity"],
  horror:      ["Sleep is for the weak","Don't look behind you","You were warned","Horror has a home","Fear finds a way","Streaming after dark","The dark side of streaming","Watch if you dare","Nightmares, delivered","The screams are real"],
  anime:       ["Plus ultra streaming","Power level: maximum","The next episode awaits","Your destiny streams here","Unlimited power","The saga continues","Eyes of a warrior","This is your moment","Believe in the run","Arc begins now"],
  adultswim:   ["on after 11","we're still here","goodnight, almost","stay up with us","you're still watching","it's late. perfect.","don't change the channel","this is the content","ok.","the weird stuff"],
  epic:        ["Every story is legendary","Born for the big screen","Where legends are made","The epic begins","Forged in fire","Rise to the moment","Worthy of the legend","This is your saga","Victory through streaming","The battle for your queue"],
  nature:      ["The world, unfiltered","Earth has a story","Nature speaks, we listen","Every creature, every moment","Wild and beautiful","The living world, streaming","Find your wild","Planet in focus","Stream with the seasons","The natural order"],
  cartoon:     ["Check it","Serious about fun","Cartoons. Duh.","The original good stuff","Watch more cartoons","Fun is our business","Drawing you in","The animated life","It's cartoon o'clock","Cartoon headquarters"],
  vhs:         ["Be kind, rewind","Press play","Tracking... please wait","Rewind to remember","Pop it in and press play","Static and stories","The analog age","Rewound and ready","Rewinding is caring","The tape lives on"],
  grindhouse:  ["NOW SHOWING","FEATURE PRESENTATION","The picture is about to begin","Ladies and gentlemen...","Take your seats","The main event","The show is about to begin","Curtain up","Coming to your screen","A presentation of excellence"],
  lofi:        ["beats to stream to","study and watch","chill vibes only","soft signal, strong content","rainy day streaming","slow down, watch something","the gentle stream","ambient entertainment","just right","background and foreground"],
  vaporwave:   ["aesthetic dreams","lost in the mall of content","remember when?","the simulation is streaming","totally.aesthetic","enter the mall","stream it on repeat","the past is pretty","Windows 95 never died","aesthetic.jpg streaming"],
  cyberpunk:   ["The future is now","Neon and nightmare","Jack in and stream","The signal never sleeps","Dark city, bright screen","Interface engaged","The net is alive","Rain on glass, fire on screen","Outlaws watch this","Escape velocity streaming"],
  hbo:         ["It's not TV","Prestige, defined","The gold standard","Some things are worth it","Where television grew up","The serious watch","Excellence, delivered","Nothing compromises here","Not for casual viewers","It's HBO"],
  blockbuster:  ["Make it a Blockbuster night","Be kind, rewind","Open seven nights a week","Your entertainment destination","No streaming required","Late fees apply","Member since opening night","The original binge destination","Returns due by midnight","Where the movies lived"],
  mst3k:        ["Keep circulating the streams","They tried to break him with bad content","In space, no one can hear you stream","Watch out for falling sequels","Brought to you by the Satellite of Love","We've got movie sign","Push the button, Frank","Not just a show. A philosophy.","Joel never left","Mike was fine too"],
  ebs:          ["This is not a test","Please stand by","We interrupt your regularly scheduled content","Remain calm and keep streaming","An alert has been issued","Stay tuned for further updates","This message is authorized","Do not adjust your set","Signal acquired","Broadcast imminent"],
  dreamworks:   ["A new kind of story","Imagination has a home","Dreams take flight here","Where the impossible streams","Beyond the clouds","Stories that soar","The dream is streaming","From a different world","Look up","Wonder, delivered"],
  tristar:      ["Fly higher","Legendary from the start","The wings of cinema","Born to run","Soaring stories","Above and beyond","Where legends take flight","The sky is the screen","Epic from the first frame","Ride the sky"],
  hannabarbera: ["Yabba dabba do","The original cartoon magic","Fun is timeless","Classics never stop","Saturday morning forever","The golden age of cartoons","Laugh until it loops","Animation nation","The original binge","Never not funny"],
  columbia:     ["A torch for great stories","Since the beginning of cinema","The original prestige","Illuminate your screen","Legacy in every frame","Where classics are born","The light of cinema","Timeless, always","A century of stories","The torch burns on"],
};

export type Preset = { name: string; style: Style; tagline: string; desc: string; vibe: string; customNotes?: string; videoPromptOverride?: string; image?: string };

export const INSPO: Preset[] = [
  { name: "Joeflix", style: "prestige",    tagline: "Where stories come alive",         desc: "Example · your name here", vibe: "Bold crimson wordmark, premium streaming identity" },
  { name: "NightOwl", style: "horror",      tagline: "Streaming after dark",             desc: "Late-night horror hub",    vibe: "Blood red & black, gothic fog, candlelit" },
  { name: "SkyBox", style: "futuristic",  tagline: "Beyond the horizon",               desc: "Sci-fi & space content",   vibe: "Holographic chrome, electric cyan, sci-fi glitch" },
  { name: "VibeTube", style: "retro",       tagline: "Totally tubular",                  desc: "80s & 90s nostalgia",      vibe: "Neon synthwave, hot pink & electric blue, CRT glow" },
  { name: "SakuraTV", style: "anime",       tagline: "Stories bloom here",               desc: "Anime & animation",        vibe: "Shonen energy burst, speed lines, electric aura" },
  { name: "EpicQuest", style: "epic",        tagline: "Every story is legendary",         desc: "Action & adventure",       vibe: "Golden hour dust, monumental scale, bronze & amber" },
  { name: "TerraDoc", style: "nature",      tagline: "The world, unfiltered",            desc: "Nature documentaries",     vibe: "Lush green, earthy organic tones, soft natural light" },
  { name: "WhiteRoom", style: "minimal",     tagline: "Less is more",                     desc: "Arthouse & indie film",    vibe: "Clean white type, soft gradient, understated" },
  { name: "LateNight", style: "adultswim",   tagline: "on after dark",                    desc: "Adult Swim bumper",        vibe: "Pure black, deadpan white Helvetica text" },
  { name: "CheckerBox", style: "cartoon",     tagline: "Serious about fun",                desc: "Cartoon Network style",    vibe: "Black & white checkerboard tiles, flat primary colors" },
  { name: "RewindFlix", style: "vhs",         tagline: "Be kind, rewind",                  desc: "90s home video",           vibe: "VHS tracking errors, washed-out colors, scan lines" },
  { name: "DriveInFlix",style: "grindhouse",  tagline: "NOW SHOWING",                      desc: "Drive-in theater",         vibe: "Kaleidoscopic rings, max-saturation, film grain" },
  { name: "ChillFlix", style: "lofi",        tagline: "beats to stream to",               desc: "Lo-fi study beats",        vibe: "Cozy anime interior, rain on window, warm lamp glow" },
  { name: "VaporFlix", style: "vaporwave",   tagline: "aesthetic dreams",                 desc: "Vaporwave",                vibe: "Marble bust, magenta/cyan grid, chromatic aberration" },
  { name: "NeonCity", style: "cyberpunk",   tagline: "The future is now",                desc: "Cyberpunk night city",     vibe: "Rain-soaked megacity, neon signs, Blade Runner mood" },
  { name: "StaticFlix", style: "hbo",         tagline: "It's not TV",                      desc: "HBO prestige style",       vibe: "3D chrome letters, fiber optic light disc, star field" },
  { name: "VideoVault", style: "blockbuster", tagline: "Make it a Blockbuster night",      desc: "Video store nostalgia",    vibe: "Gold on navy blue, bold block lettering, late 80s" },
];

export const SEASONAL: Preset[] = [
  { name: "Fall", style: "cinematic",  tagline: "The season of great stories",  desc: "Fall",   vibe: "Warm amber tones, golden autumn light, falling leaves",  image: "/previews/fall.jpg",   customNotes: "autumn leaves drifting down, warm amber and orange hues, golden light through turning foliage, crisp air" },
  { name: "Winter", style: "minimal",    tagline: "Crisp nights, great stories",  desc: "Winter", vibe: "Icy blue-white palette, clean snowfall, minimalist",      image: "/previews/winter.jpg", customNotes: "winter frost and fresh snowfall, cool blue-white palette, clean icy crisp quiet atmosphere" },
  { name: "Spring", style: "anime",      tagline: "Where great stories bloom",    desc: "Spring", vibe: "Cherry blossoms, anime pastel colors, nature awakening",  image: "/previews/spring.jpg", customNotes: "blooming cherry blossoms, fresh spring morning light, pastel colors, nature awakening and renewal" },
  { name: "Summer", style: "epic",       tagline: "Blockbuster season is here",   desc: "Summer", vibe: "Bold bright energy, blazing golden sun, epic scale",       image: "/previews/summer.jpg", customNotes: "blazing summer sun high overhead, golden warm light, bold bright saturated energy, heat shimmer" },
];

export const HOLIDAYS: Preset[] = [
  { name: "Easter", style: "lofi",       tagline: "Where stories bloom",           desc: "Easter",           vibe: "Soft spring pastels, wildflowers, robin egg blue",         image: "/previews/easter.jpg",       customNotes: "sunrise spring morning, soft pastel wildflowers blooming, pale blue robin eggs, gentle birdsong warmth" },
  { name: "Mother's Day", style: "lofi",       tagline: "With love, always",              desc: "Mother's Day",     vibe: "Garden roses, warm golden morning light",                  image: "/previews/mothers-day.jpg",  customNotes: "fresh garden roses and soft lavender blooms, warm golden morning sunlight, heartfelt and tender" },
  { name: "Father's Day", style: "epic",       tagline: "Dad approved content",           desc: "Father's Day",     vibe: "Golden americana, amber summer afternoon",                  image: "/previews/fathers-day.jpg",  customNotes: "golden summer afternoon, classic americana warmth, amber light, the films he always wanted to share" },
  { name: "Halloween", style: "horror",     tagline: "Horror has a home",              desc: "Halloween",        vibe: "Jack-o-lanterns, orange & black, gothic horror",            image: "/previews/halloween.jpg",    customNotes: "jack-o-lanterns and cobwebs, haunted autumn night atmosphere, orange and black" },
  { name: "Christmas", style: "cinematic",  tagline: "The magic of Christmas",         desc: "Christmas",        vibe: "Holiday reds & greens, glowing ornaments, snowfall",        image: "/previews/christmas.jpg",    customNotes: "Christmas tree with glowing lights and ornaments, snowfall, warm holiday red and green" },
  { name: "New Year's Eve", style: "futuristic", tagline: "The future starts tonight",      desc: "New Year's Eve",   vibe: "Gold & silver fireworks, midnight countdown",               image: "/previews/new-years.jpg",    customNotes: "fireworks bursting overhead, countdown to midnight celebration, gold and silver confetti" },
  { name: "Oscar Night", style: "cinematic",  tagline: "And the award goes to...",       desc: "Oscar Night",      vibe: "Red carpet glamour, gleaming gold statuettes",              image: "/previews/oscars.jpg",       customNotes: "Hollywood red carpet, gleaming gold award statuettes, black-tie glamour, sequins and spotlights" },
  { name: "Pride", style: "epic",       tagline: "Stream with pride",              desc: "Pride",            vibe: "Full ROYGBIV rainbow explosion, joyful celebration energy", image: "/previews/pride.jpg",        customNotes: "rainbow pride flag spectrum — vivid red orange yellow green blue violet rays bursting outward from behind the logo, full saturated ROYGBIV color explosion, joyful pride parade celebration energy, love and joy radiating in every direction" },
  { name: "Valentine's Day",style: "retro",      tagline: "For the love of streaming",      desc: "Valentine's Day",  vibe: "Hearts & roses, romantic pink and crimson",                 image: "/previews/valentines.jpg",   customNotes: "hearts and red roses, romantic pink and crimson palette, love in the air" },
  { name: "St. Patrick's Day",style: "nature",     tagline: "Stream your luck tonight",       desc: "St. Patrick's Day",vibe: "Vivid Irish green, shamrocks, golden sunlight",             image: "/previews/st-patricks.jpg",  customNotes: "shamrocks and clover, rich vivid Irish green, golden sunlight, festive spirit" },
  { name: "Fourth of July", style: "epic",       tagline: "Independence from bad content",  desc: "Fourth of July",   vibe: "Red, white & blue fireworks, patriotic night sky",          image: "/previews/fourth-of-july.jpg",customNotes: "fireworks in red white and blue, patriotic summer night sky, stars and stripes energy" },
  { name: "Thanksgiving", style: "cinematic",  tagline: "Gather and stream together",     desc: "Thanksgiving",     vibe: "Harvest warmth, cornucopia, earthy autumn tones",           image: "/previews/thanksgiving.jpg", customNotes: "harvest cornucopia and autumn abundance, warm earthy tones, grateful gathering season" },
  { name: "Hanukkah", style: "minimal",    tagline: "Eight nights of great picks",    desc: "Hanukkah",         vibe: "Blue & silver, glowing menorah, Festival of Lights",        image: "/previews/hanukkah.jpg",     customNotes: "menorah with glowing candles, blue and silver palette, Festival of Lights warmth" },
];

export const STUDIOS: Preset[] = [
  {
    name: "DreamWorks", style: "dreamworks", tagline: "Where dreams take flight",
    desc: "DreamWorks", vibe: "Boy fishing on a crescent moon above the clouds", image: "/studios/thumbs/dreamworks.webp",
    videoPromptOverride: `The camera drifts slowly upward through the clouds. Billowing white cumulus clouds roll and churn around the edges of the frame, their soft puffy shapes shifting and morphing as they pass. The boy sits on the crescent moon holding his fishing rod, the fishing line sways and dangles in the breeze. The crescent moon glows faintly. Sunlight filters through the clouds with shifting highlights. The text at the bottom of the frame remains steady and stable, completely motionless, no warping or movement. Cinematic, dreamy atmosphere.`,
  },
  {
    name: "TriStar", style: "tristar", tagline: "Soar above the rest",
    desc: "TriStar", vibe: "Pegasus galloping through golden clouds", image: "/studios/thumbs/tristar.webp",
    videoPromptOverride: `The Pegasus gallops in place mid-air, its front legs reaching forward and rear legs kicking back in a powerful running motion, hooves cycling through the air as if charging across the sky. Its massive wings flap up and down with strong, powerful strokes, feathers flexing with each beat. Its mane whips wildly in the wind and its tail streams behind it. The clouds churn and roll across the sky, moving from right to left. Sunlight pulses and flares behind the horse. The water below ripples and shimmers with bright reflections. Dynamic, dramatic motion throughout the entire frame.`,
  },
  {
    name: "Hanna-Barbera", style: "hannabarbera", tagline: "The original cartoon magic",
    desc: "Hanna-Barbera", vibe: "Chrome star trailing rainbow swirl, retro broadcast", image: "/studios/thumbs/hannabarbera.webp",
    videoPromptOverride: `A 1980s broadcast logo animation on a pure black background. A bright chrome five-pointed star flies through the air in a swooping circular motion, looping around in a full ring, then at the end of its path it swoops upward in a final flourish and comes to rest at the top of the circle. As the star flies, it leaves behind a thick glowing ribbon of rainbow light in its wake — purple, magenta, pink, green, and blue streaks layered like a long-exposure light painting. The rainbow trail persists and remains fully visible after the star finishes its motion, forming a complete glowing circular swirl with an upward tail at the end, with the star resting at the top. Once the star settles into place, the chunky white wordmark fades in below. Retro cel-animation-meets-early-CGI aesthetic, soft neon glow, slight film grain.`,
  },
  {
    name: "Columbia", style: "columbia", tagline: "A torch for great stories",
    desc: "Columbia", vibe: "Torch bearer, classical light beams, cinematic", image: "/studios/thumbs/columbia.webp",
    videoPromptOverride: ``,
  },
  {
    name: "MST3K", style: "mst3k", tagline: "We've got movie sign",
    desc: "MST3K", vibe: "Silhouetted theater seats, asteroid, deep space", image: "/studios/thumbs/mst3k.webp",
    videoPromptOverride: `The asteroid slowly rotates in the starfield. Stars twinkle in the deep purple-blue space. The silhouetted figures in the theater seats below gesture and point upward. Campy, low-budget sci-fi energy. The text on the right side of the frame holds steady and motionless.`,
  },
  {
    name: "Emergency Broadcast", style: "ebs", tagline: "This is not a test",
    desc: "Emergency Broadcast", vibe: "SMPTE color bars, monospace alert text, broadcast signal", image: "/previews/ebs.jpg",
    videoPromptOverride: `SMPTE color bars hold completely static on screen. A harsh single-frequency tone. The black label bar with white monospace text flashes urgently twice, then holds steady. Pure broadcast emergency energy. No camera movement. Static and tense.`,
  },
];

// Styles that skip Runway image generation and render the logo directly on canvas
export const CANVAS_STYLES = new Set<Style>(["adultswim", "minimal", "prestige", "dreamworks", "tristar", "hannabarbera", "columbia", "mst3k", "ebs"]);

// The cinematic style with a placeholder name, for people who want to start from their own brand.
export const BLANK_SLATE: Preset = { name: "My Service", style: "cinematic", tagline: "", desc: "Blank Slate", vibe: "Cinematic base, your name and brand", image: "/previews/blank-slate.jpg", customNotes: "" };

export const THEME_GROUPS = [
  { id: "seasonal", title: "Seasonal", presets: SEASONAL },
  { id: "holidays", title: "Holidays", presets: HOLIDAYS },
  { id: "studios", title: "Classic studios", presets: STUDIOS },
];

/** A suggested tagline for the style other than the current one, or the current one when there is no other. */
export function nextTagline(style: Style, current: string, random = Math.random): string {
  const available = STYLE_TAGLINES[style].filter((t) => t !== current);
  return available.length ? available[Math.floor(random() * available.length)] : current;
}
