"use client";

import { useState, useRef, useEffect, useId } from "react";
import { WebAppJsonLd } from "./WebAppJsonLd";
import { preload } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { buildPrompts, imageRatio, type Style, type Duration, type ImageModel, type VideoModel, type Treatment } from "@/lib/runway";
import { useApiKey } from "@/hooks/useApiKey";
import { LINKS, tweetShareUrl, redditShareUrl } from "@/lib/links";
import { isEnterToSubmitNotes } from "@/lib/enterToSubmit";
import { track } from "@/lib/plausible";
import { sleepUnlessAborted } from "@/lib/sleepUnlessAborted";
import { pulseOnce } from "@/lib/pulseOnce";
import { AudioMixer } from "./AudioMixer";
import { ProgressBar } from "./ProgressBar";
import { Collapsible } from "./Collapsible";

type GenStep = "idle" | "image" | "review" | "video" | "done" | "error";

const SESSION_KEY = "streamroll_gen_state";

// Per-style accent colors used for selected state
const STYLE_COLOR: Record<Style, string> = {
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

const STYLES: { id: Style; label: string; desc: string; tip?: string; image?: string }[] = [
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

const STYLE_DEFAULTS: Record<Style, { videoModel: VideoModel; imageModel: ImageModel; treatment: Treatment; duration: Duration }> = {
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

const STYLE_TAGLINES: Record<Style, string[]> = {
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

const DURATIONS: { value: Duration; label: string; est: string }[] = [
  { value: 2,  label: "2s",  est: "~20 sec" },
  { value: 4,  label: "4s",  est: "~30 sec" },
  { value: 5,  label: "5s",  est: "~35 sec" },
  { value: 10, label: "10s", est: "~60 sec" },
];

type Preset = { name: string; style: Style; tagline: string; desc: string; vibe: string; customNotes?: string; videoPromptOverride?: string; image?: string };

const INSPO: Preset[] = [
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

const SEASONAL: Preset[] = [
  { name: "Fall", style: "cinematic",  tagline: "The season of great stories",  desc: "Fall",   vibe: "Warm amber tones, golden autumn light, falling leaves",  image: "/previews/fall.jpg",   customNotes: "autumn leaves drifting down, warm amber and orange hues, golden light through turning foliage, crisp air" },
  { name: "Winter", style: "minimal",    tagline: "Crisp nights, great stories",  desc: "Winter", vibe: "Icy blue-white palette, clean snowfall, minimalist",      image: "/previews/winter.jpg", customNotes: "winter frost and fresh snowfall, cool blue-white palette, clean icy crisp quiet atmosphere" },
  { name: "Spring", style: "anime",      tagline: "Where great stories bloom",    desc: "Spring", vibe: "Cherry blossoms, anime pastel colors, nature awakening",  image: "/previews/spring.jpg", customNotes: "blooming cherry blossoms, fresh spring morning light, pastel colors, nature awakening and renewal" },
  { name: "Summer", style: "epic",       tagline: "Blockbuster season is here",   desc: "Summer", vibe: "Bold bright energy, blazing golden sun, epic scale",       image: "/previews/summer.jpg", customNotes: "blazing summer sun high overhead, golden warm light, bold bright saturated energy, heat shimmer" },
];

const HOLIDAYS: Preset[] = [
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


const STUDIOS: Preset[] = [
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
const CANVAS_STYLES = new Set<Style>(["adultswim", "minimal", "prestige", "dreamworks", "tristar", "hannabarbera", "columbia", "mst3k", "ebs"]);

type LogoMode = "ai" | "upload";
type GenMode = "image-only" | "full";


const COLOR_SWATCHES = [
  { label: "Gold",    value: "#F59E0B" },
  { label: "Crimson", value: "#EF4444" },
  { label: "Blue",    value: "#3B82F6" },
  { label: "Purple",  value: "#8B5CF6" },
  { label: "Cyan",    value: "#06B6D4" },
  { label: "Green",   value: "#22C55E" },
  { label: "Pink",    value: "#EC4899" },
  { label: "White",   value: "#F9FAFB" },
];

const TREATMENTS: { id: Treatment; label: string; desc: string }[] = [
  { id: "full-bleed",  label: "Full Bleed",  desc: "Logo fills the frame" },
  { id: "theatrical",  label: "Theatrical",  desc: "Black letterbox bars" },
  { id: "minimal",     label: "Minimal",     desc: "Small logo, vast space" },
];

const VEO_DURATIONS: { value: Duration; label: string; est: string }[] = [
  { value: 4, label: "4s", est: "~45 sec" },
  { value: 6, label: "6s", est: "~60 sec" },
  { value: 8, label: "8s", est: "~75 sec" },
];

const IMAGE_MODELS: { id: ImageModel; label: string; group: "Runway" | "OpenAI" | "Google"; crInfo: string; crCost: number; desc: string }[] = [
  { id: "gen4_image",        label: "Gen4 Image",         group: "Runway",  crInfo: "~30 cr",  crCost: 30, desc: "Creative, artistic style" },
  { id: "gen4_image_turbo",  label: "Gen4 Turbo",         group: "Runway",  crInfo: "~15 cr",  crCost: 15, desc: "Faster, great quality" },
  { id: "gpt_image_2",       label: "GPT Image 2",        group: "OpenAI",  crInfo: "~40 cr",  crCost: 40, desc: "Precise instruction-following" },
  { id: "gemini_image3_pro", label: "Gemini Image 3 Pro", group: "Google",  crInfo: "~20 cr",  crCost: 20, desc: "Vivid, instruction-aware" },
  { id: "gemini_2.5_flash",  label: "Gemini 2.5 Flash",   group: "Google",  crInfo: "~10 cr",  crCost: 10, desc: "Fast, Google quality" },
];

const VIDEO_MODELS: { id: VideoModel; label: string; group: "Runway" | "Google"; crInfo: string; desc: string }[] = [
  { id: "gen4_turbo",  label: "Gen4 Turbo",  group: "Runway", crInfo: "5 cr/s",   desc: "Fast, great quality" },
  { id: "gen4.5",      label: "Gen4.5",       group: "Runway", crInfo: "12 cr/s",  desc: "Highest quality" },
  { id: "gen3a_turbo", label: "Gen3a Turbo",  group: "Runway", crInfo: "5 cr/s",   desc: "Previous generation" },
  { id: "veo3",        label: "Veo 3",        group: "Google", crInfo: "~25 cr/s", desc: "Google video model" },
  { id: "veo3.1",      label: "Veo 3.1",      group: "Google", crInfo: "~25 cr/s", desc: "Google latest" },
  { id: "veo3.1_fast", label: "Veo 3.1 Fast", group: "Google", crInfo: "~15 cr/s", desc: "Fast Google model" },
];

const PLATFORMS = [
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

export default function Home() {
  const router = useRouter();
  const [name, setName]         = useState("Joeflix");
  const [tagline, setTagline]   = useState("Where stories come alive");
  const [style, setStyle]       = useState<Style>("cinematic");
  const [duration, setDuration] = useState<Duration>(STYLE_DEFAULTS["cinematic"].duration);
  const [step, setStep]         = useState<GenStep>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [logoMode, setLogoMode] = useState<LogoMode>("ai");
  const [imageModel, setImageModel] = useState<ImageModel>("gen4_image");
  const [videoModel, setVideoModel] = useState<VideoModel>(STYLE_DEFAULTS["cinematic"].videoModel);
  const [treatment, setTreatment] = useState<Treatment>(STYLE_DEFAULTS["cinematic"].treatment);
    const [customNotes, setCustomNotes] = useState("");
  const [uploadedUri, setUploadedUri] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [genStartedAt, setGenStartedAt] = useState(0);
  const [timings, setTimings] = useState<{ image: number; video: number } | null>(null);
  const [credits, setCredits] = useState<{ image: number; video: number } | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [audio, setAudio] = useState(false);
  const [pendingAudioFile, setPendingAudioFile] = useState<File | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [rememberKey, setRememberKey] = useState(true);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [pendingAudioPreviewUrl, setPendingAudioPreviewUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [genMode, setGenMode] = useState<GenMode>("full");
  const [reviewNotes, setReviewNotes] = useState("");
  const [videoRegenNotes, setVideoRegenNotes] = useState("");
  const [sessionRestored, setSessionRestored] = useState(false);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const [pollProgress, setPollProgress] = useState<number | null>(null);
  const [imagePromptOverride, setImagePromptOverride] = useState<string | null>(null);
  const [videoPromptOverride, setVideoPromptOverride] = useState<string | null>(null);
  const [cancelTaskId, setCancelTaskId] = useState("");
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [posterDownloadError, setPosterDownloadError] = useState<string | null>(null);
  // A finished video that is still loading: the skeleton (or the old video, on a redo) stays until it can play.
  const [incomingVideoUrl, setIncomingVideoUrl] = useState<string | null>(null);
  // The video being replaced, kept underneath while the new one fades in.
  const [outgoingVideoUrl, setOutgoingVideoUrl] = useState<string | null>(null);
  // Only a freshly generated poster wipes in; one restored on load just appears.
  const [revealPoster, setRevealPoster] = useState(false);
  const imageTimeRef = useRef(0);
  const imageCreditCostRef = useRef(0);
  const activeTaskIdRef = useRef<string | null>(null);
  const cancelControllerRef = useRef<AbortController | null>(null);
  const currentVideoRef = useRef<HTMLVideoElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const activePresetRef = useRef<string>("direct");
  const restoredFromSessionRef = useRef(false);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
  const apiKeyStatusRef = useRef<HTMLDivElement>(null);
  const keyFocusAfterChangeRef = useRef(false);

  // LCP: the hero poster is the first thing painted, so fetch it before the video.
  preload(HERO_POSTER, { as: "image", fetchPriority: "high" });

  // Restore completed generation from sessionStorage on mount.
  // Multiple setState calls here are intentional — we batch-restore persisted state.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.step === "done" || p.step === "error" || p.step === "review") {
          /* eslint-disable react-hooks/set-state-in-effect */
          if (p.name)    setName(p.name);
          if (p.style)   setStyle(p.style);
          if (p.tagline !== undefined) setTagline(p.tagline);
          if (p.imageUrl) setImageUrl(p.imageUrl);
          if (p.videoUrl) setVideoUrl(p.videoUrl);
          if (p.timings)  setTimings(p.timings);
          if (p.error)    setError(p.error);
          if (p.videoModel)  setVideoModel(p.videoModel);
          if (p.imageModel)  setImageModel(p.imageModel);
          if (p.treatment)   setTreatment(p.treatment);
          if (p.duration)    setDuration(p.duration);
          restoredFromSessionRef.current = true;
          setStep(p.step);
          /* eslint-enable react-hooks/set-state-in-effect */
        }
      }
    } catch {}
    setSessionRestored(true);
  }, []);

  // Persist completed/error state to sessionStorage so navigation doesn't wipe results
  useEffect(() => {
    if (!sessionRestored) return;
    if (step === "done" || step === "error" || step === "review") {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(
          { step, imageUrl, videoUrl, timings, error, name, style, tagline, videoModel, imageModel, treatment, duration }
        ));
      } catch {}
    } else if (step === "idle") {
      try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    }
  }, [step, imageUrl, videoUrl, timings, error, name, style, tagline, sessionRestored, videoModel, imageModel, treatment, duration]);

  // Warn before browser-level unload (refresh/close) while a generation is running
  useEffect(() => {
    if (step !== "image" && step !== "video") return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step]);

  // Move focus to result when generation completes so keyboard/screen-reader users
  // don't have to discover the change by tabbing.
  // A result restored from sessionStorage on load is not news: leave the page at the top.
  useEffect(() => {
    if (step !== "done" && step !== "review") return;
    if (restoredFromSessionRef.current) { restoredFromSessionRef.current = false; return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    resultRef.current?.focus({ preventScroll: true });
  }, [step]);

  // While a redo runs, the old video holds still under the progress bar so only the bar moves.
  useEffect(() => {
    const vid = currentVideoRef.current;
    if (!vid) return;
    if (step === "video") vid.pause();
    // Muted autoplay can't be refused; a rejection here only means the element went away mid-call.
    else if (vid.paused) vid.play().catch(() => {});
  }, [step, videoUrl]);

  const { key: apiKey, loaded: keyLoaded, saveKey, clearKey } = useApiKey();

  // After saving or removing the key, the control that was focused is gone: move focus to its replacement.
  useEffect(() => {
    if (!keyFocusAfterChangeRef.current) return;
    keyFocusAfterChangeRef.current = false;
    (apiKey ? apiKeyStatusRef.current : apiKeyInputRef.current)?.focus();
  }, [apiKey]);

  function saveApiKeyFromInput() {
    if (!apiKeyInput.trim()) return;
    keyFocusAfterChangeRef.current = true;
    saveKey(apiKeyInput, { remember: rememberKey });
    setApiKeyInput("");
    setApiKeySaved(true);
  }

  function removeApiKey() {
    keyFocusAfterChangeRef.current = true;
    clearKey();
    setApiKeySaved(false);
  }
  const preview = buildPrompts({ name, style, tagline, duration, treatment, videoModel, primaryColor: primaryColor ?? undefined, customNotes: customNotes || undefined });
  const isGenerating = step === "image" || step === "video";
  const accentColor = STYLE_COLOR[style];
  const imageCrCost = CANVAS_STYLES.has(style) ? 0 : (IMAGE_MODELS.find(m => m.id === imageModel)?.crCost ?? 30);
  const gen3aTurboPromptTooLong = videoModel === "gen3a_turbo" && (videoPromptOverride ?? preview.videoPrompt).length > 768;
  const crPerSec = videoModel === "gen4.5" ? 12 : videoModel === "veo3" || videoModel === "veo3.1" ? 25 : videoModel === "veo3.1_fast" ? 15 : 5;
  const isVeoModel = videoModel === "veo3" || videoModel === "veo3.1" || videoModel === "veo3.1_fast";
  const activeDurations = isVeoModel ? VEO_DURATIONS : DURATIONS;

  function shuffleTagline() {
    const suggestions = STYLE_TAGLINES[style];
    const available = suggestions.filter(t => t !== tagline);
    if (!available.length) return;
    setTagline(available[Math.floor(Math.random() * available.length)]);
  }

  async function downloadPoster() {
    if (!imageUrl) return;
    track("Download Poster", { style });
    setPosterDownloadError(null);
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Runway returned ${res.status}`);
      const blob = await res.blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = makeFilename(name, style).replace(".mp4", `.${ext}`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      setPosterDownloadError(`Download failed (${reason}). Runway’s image links expire after a while; if this keeps failing, regenerate the poster.`);
    }
  }

  async function downloadVideo() {
    if (!videoUrl) return;
    track("Download Video", { style, video_model: videoModel });
    setDownloadError(null);
    try {
      // Runway's CDN sends Access-Control-Allow-Origin: *, so the MP4 can be saved under our filename.
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error(`Runway returned ${res.status}`);
      const objUrl = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = makeFilename(name, style);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      setDownloadError(`Download failed (${reason}). Runway’s video links expire after a while; if this keeps failing, redo the video.`);
    }
  }

  function applyInspo(i: Preset) {
    activePresetRef.current = i.name;
    setName(i.name);
    setTagline(i.tagline);
    setStyle(i.style);
    const d = STYLE_DEFAULTS[i.style];
    setVideoModel(d.videoModel);
    setImageModel(d.imageModel);
    setTreatment(d.treatment);
    setDuration(d.duration);
    setCustomNotes(i.customNotes ?? "");
    setVideoPromptOverride(i.videoPromptOverride ?? null);
    setStep("idle");
    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
  }

  // Asks Runway to stop the running task without blocking the UI; a failure is shown, since the task may still use credits.
  function cancelActiveTask() {
    const taskId = activeTaskIdRef.current;
    if (!taskId) return;
    activeTaskIdRef.current = null;
    setCancelError(null);
    cancelRunwayTask(taskId).catch((e) => {
      const reason = e instanceof Error ? e.message : String(e);
      setCancelError(`Couldn’t cancel the Runway task (${reason}). It may still finish and use credits; check your Runway dashboard.`);
    });
  }

  async function cancelRunwayTask(taskId: string) {
    const headers: Record<string, string> = {};
    if (apiKey) headers["x-runway-key"] = apiKey;
    const res = await fetch(`/api/video/cancel?id=${encodeURIComponent(taskId)}`, { method: "DELETE", headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `cancel failed with ${res.status}`);
    }
  }

  function handleCancelVideo() {
    setCancelling(true);
    cancelControllerRef.current?.abort("cancel");
    cancelActiveTask();
  }

  function reset() {
    cancelControllerRef.current?.abort("reset");
    cancelActiveTask();
    setIncomingVideoUrl(null);
    setOutgoingVideoUrl(null);
    setCancelling(false);
    setPosterDownloadError(null);
    setPollStatus(null);
    setPollProgress(null);
    setCancelMsg(null);
    setCancelTaskId("");
    setConfirmingReset(false);
    setStep("idle");
    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
    setTimings(null);
    setCredits(null);
    setVideoRegenNotes("");
    setDownloadError(null);
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  }

  function safeReset() {
    if (step === "done" && videoUrl) {
      setConfirmingReset(true);
    } else {
      reset();
    }
  }

  function handleModelChange(m: VideoModel) {
    setVideoModel(m);
    const veo = m === "veo3" || m === "veo3.1" || m === "veo3.1_fast";
    if (veo && ![4, 6, 8].includes(duration)) setDuration(4 as Duration);
    else if (!veo && ![2, 4, 5, 10].includes(duration)) setDuration(5 as Duration);
  }

  async function handleFileUpload(file: File) {
    setUploadError(null);
    setUploadedUri(null);

    const MAX_BYTES = 3 * 1024 * 1024; // 3 MB — keeps data URI under Vercel's 4.5 MB body limit
    if (file.size > MAX_BYTES) {
      setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 3 MB.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setUploadPreview(previewUrl);
    setIsUploading(true);
    try {
      // Runway rejects promptImage with width/height > 2.358 — validate before burning credits.
      await new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          const ratio = img.naturalWidth / img.naturalHeight;
          if (ratio > 2.358) {
            reject(new Error(
              `Image too wide (${img.naturalWidth}×${img.naturalHeight}, ratio ${ratio.toFixed(2)}:1). ` +
              `Runway requires a width-to-height ratio of at most 2.36:1. Try cropping to 16:9 or squarer.`
            ));
          } else {
            resolve();
          }
        };
        img.onerror = () => reject(new Error("Failed to load image for dimension check"));
        img.src = previewUrl;
      });

      // Read as base64 data URI — Runway's promptImage accepts data URIs directly,
      // so no server-side upload or API key needed for this step.
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      setUploadedUri(dataUri);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Failed to read file");
    } finally {
      setIsUploading(false);
    }
  }

  function buildBody(overrideNotes?: string) {
    return {
      name: name.trim(), style, tagline: tagline.trim(), duration,
      imageModel, videoModel, treatment,
      primaryColor: primaryColor ?? undefined,
      customNotes: overrideNotes ?? (customNotes.trim() || undefined),
      audio: isVeoModel ? audio : undefined,
      imagePromptOverride: imagePromptOverride ?? undefined,
      videoPromptOverride: videoPromptOverride ?? undefined,
    };
  }

  // Decode the poster off-screen first, so it appears whole in one reveal instead of painting in as it loads.
  async function showGeneratedPoster(url: string) {
    setRevealPoster(true);
    try {
      const img = new window.Image();
      img.src = url;
      await img.decode();
    } catch (e) {
      throw new Error(`The poster was generated but couldn’t be loaded (${e instanceof Error ? e.message : String(e)})`);
    } finally {
      setImageUrl(url);
    }
  }

  function startTimer() {
    setGenStartedAt(Date.now());
  }

  async function generateCanvasLogo(): Promise<string> {
    const W = 1280, H = 720;
    const cvs = document.createElement("canvas");
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext("2d")!;

    const displayName = name.trim().toUpperCase();
    const hasTagline = Boolean(tagline?.trim());

    // Helper: auto-fit text to a target pixel width
    function fitFontSize(fontSpec: (sz: number) => string, text: string, targetW: number, maxSz: number, minSz: number): number {
      ctx.font = fontSpec(maxSz);
      const measured = ctx.measureText(text).width;
      if (measured <= targetW) return maxSz;
      const scaled = Math.floor(maxSz * (targetW / measured));
      return Math.max(minSz, scaled);
    }

    if (style === "adultswim") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);

      const bracketName = `[${name.trim().toLowerCase()}]`;
      const fontSize = fitFontSize(sz => `400 ${sz}px "Arial Narrow","Helvetica Neue",Helvetica,Arial,sans-serif`, bracketName, W * 0.80, 80, 24);
      ctx.font = `400 ${fontSize}px "Arial Narrow","Helvetica Neue",Helvetica,Arial,sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(bracketName, W / 2, hasTagline ? H * 0.46 : H * 0.5);

      if (hasTagline) {
        const tagFontSize = Math.max(16, Math.floor(fontSize * 0.44));
        ctx.font = `400 ${tagFontSize}px "Arial Narrow","Helvetica Neue",Helvetica,Arial,sans-serif`;
        ctx.fillText(tagline!.trim().toLowerCase(), W / 2, H * 0.59);
      }

    } else if (style === "minimal") {
      await document.fonts.load(`300 100px "Geist"`);
      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, W, H);

      const fontSize = fitFontSize(sz => `300 ${sz}px "Geist","Helvetica Neue",Helvetica,sans-serif`, displayName, W * 0.72, 200, 36);
      ctx.font = `300 ${fontSize}px "Geist","Helvetica Neue",Helvetica,sans-serif`;
      ctx.fillStyle = "#f0f0f0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const centerY = hasTagline ? H * 0.44 : H * 0.5;
      ctx.fillText(displayName, W / 2, centerY);

      // Thin rule beneath
      const textWidth = ctx.measureText(displayName).width;
      ctx.strokeStyle = "#282828";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - textWidth / 2, centerY + fontSize * 0.62 + 10);
      ctx.lineTo(W / 2 + textWidth / 2, centerY + fontSize * 0.62 + 10);
      ctx.stroke();

      if (hasTagline) {
        const tagFontSize = Math.max(16, Math.floor(fontSize * 0.20));
        ctx.font = `300 ${tagFontSize}px "Geist","Helvetica Neue",Helvetica,sans-serif`;
        ctx.fillStyle = "#555555";
        ctx.fillText(tagline!.trim().toUpperCase(), W / 2, H * 0.62);
      }

    } else if (style === "prestige") {
      await document.fonts.load(`900 100px "Geist"`);
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, W, H);

      const fontSize = fitFontSize(sz => `900 ${sz}px "Geist","Helvetica Neue",Helvetica,sans-serif`, displayName, W * 0.78, 200, 40);
      ctx.font = `900 ${fontSize}px "Geist","Helvetica Neue",Helvetica,sans-serif`;
      ctx.fillStyle = "#E50914";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const centerY = hasTagline ? H * 0.44 : H * 0.5;
      ctx.fillText(displayName, W / 2, centerY);

      if (hasTagline) {
        const tagFontSize = Math.max(16, Math.floor(fontSize * 0.20));
        ctx.font = `400 ${tagFontSize}px "Geist","Helvetica Neue",Helvetica,sans-serif`;
        ctx.fillStyle = "#666666";
        ctx.fillText(tagline!.trim().toUpperCase(), W / 2, H * 0.62);
      }

    } else if (style === "ebs") {
      // SMPTE color bars — drawn entirely in canvas
      const bars = ["#FFFFFF","#FFFF00","#00FFFF","#00FF00","#FF00FF","#FF0000","#0000FF"];
      const bw = W / bars.length;
      const barsH = Math.round(H * 0.60);
      bars.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * bw, 0, bw, barsH); });

      // PLUGE bottom section
      const pluge = ["#0000FF","#000000","#FF00FF","#000000","#00FFFF","#000000","#BEBEBE"];
      pluge.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * bw, barsH, bw, H - barsH); });

      // Black label bar
      const labelH = Math.round(H * 0.13);
      const labelY = Math.round(H * 0.22);
      ctx.fillStyle = "#000000";
      ctx.fillRect(Math.round(W * 0.12), labelY, Math.round(W * 0.76), labelH);

      // Service name in monospace
      const fontSize = fitFontSize(sz => `700 ${sz}px "Courier New",Courier,monospace`, displayName, W * 0.68, 56, 16);
      ctx.font = `700 ${fontSize}px "Courier New",Courier,monospace`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(displayName, W / 2, labelY + labelH / 2);

      if (hasTagline) {
        const tagFontSize = Math.max(14, Math.floor(fontSize * 0.36));
        ctx.font = `400 ${tagFontSize}px "Courier New",Courier,monospace`;
        ctx.fillStyle = "#000000";
        ctx.fillRect(Math.round(W * 0.20), labelY + labelH + 6, Math.round(W * 0.60), tagFontSize + 12);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(tagline!.trim().toUpperCase(), W / 2, labelY + labelH + 6 + (tagFontSize + 12) / 2);
      }

    } else if (style === "mst3k") {
      // MST3K: background image + bold yellow italic text in open starfield
      const bg = document.createElement("img");
      bg.src = `/studios/mst3k.png`;
      await new Promise<void>((resolve, reject) => { bg.onload = () => resolve(); bg.onerror = reject; });
      ctx.drawImage(bg, 0, 0, W, H);

      // Center of open starfield zone (right of planet): roughly x=700–1280, center ~990
      const textX = W * 0.70;
      const textY = H * 0.42;
      const fontSize = fitFontSize(sz => `italic 900 ${sz}px "Arial Black",Impact,sans-serif`, displayName, W * 0.42, 90, 24);

      ctx.save();
      // Skew for that campy silly italic lean
      ctx.transform(1, -0.08, 0.22, 1, 0, 0);
      // Adjust x/y for skew offset so text stays visually centered in zone
      const skewOffsetX = textY * 0.22;
      const skewOffsetY = textX * -0.08;

      ctx.font = `italic 900 ${fontSize}px "Arial Black",Impact,sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#FFE000";
      ctx.fillText(displayName, textX - skewOffsetX, textY - skewOffsetY);

      if (hasTagline) {
        const tagFontSize = Math.max(14, Math.floor(fontSize * 0.30));
        ctx.font = `italic 700 ${tagFontSize}px "Arial Black",Impact,sans-serif`;
        ctx.fillStyle = "#FFE000";
        ctx.globalAlpha = 0.85;
        ctx.fillText(tagline!.trim().toUpperCase(), textX - skewOffsetX, textY - skewOffsetY + fontSize * 0.78);
        ctx.globalAlpha = 1;
      }
      ctx.restore();

    } else if (style === "dreamworks" || style === "tristar" || style === "hannabarbera" || style === "columbia") {
      // Load background image
      const bg = document.createElement("img");
      bg.src = `/studios/${style}.png`;
      await new Promise<void>((resolve, reject) => { bg.onload = () => resolve(); bg.onerror = reject; });
      ctx.drawImage(bg, 0, 0, W, H);

      // Per-studio text styling
      const studioConfigs: Record<string, { font: (sz: number) => string; color: string; shadowColor: string; textY: number; clearY: number; clearH: number }> = {
        dreamworks: {
          font: sz => `300 italic ${sz}px Georgia,"Times New Roman",serif`,
          color: "#ffffff",
          shadowColor: "rgba(0,30,80,0.6)",
          textY: H * 0.78,
          clearY: H * 0.65,
          clearH: H * 0.35,
        },
        tristar: {
          font: sz => `400 ${sz}px Georgia,"Times New Roman",serif`,
          color: "#ffffff",
          shadowColor: "rgba(0,0,0,0.7)",
          textY: H * 0.80,
          clearY: H * 0.66,
          clearH: H * 0.34,
        },
        hannabarbera: {
          font: sz => `900 ${sz}px Arial,Helvetica,sans-serif`,
          color: "#ffffff",
          shadowColor: "rgba(0,0,0,0.0)",
          textY: H * 0.80,
          clearY: H * 0.65,
          clearH: H * 0.35,
        },
        columbia: {
          font: sz => `700 ${sz}px Georgia,"Times New Roman",serif`,
          color: "#f5deb3",
          shadowColor: "rgba(0,0,0,0.0)",
          textY: H * 0.16,
          clearY: H * 0.04,
          clearH: H * 0.20,
        },
      };

      const cfg = studioConfigs[style];

      // Gradient overlay so text is readable
      const grad = ctx.createLinearGradient(0, cfg.clearY, 0, H);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, cfg.shadowColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, cfg.clearY, W, cfg.clearH);

      // For Hanna-Barbera, clear a solid black strip under the circle for the text
      if (style === "hannabarbera") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, H * 0.68, W, H * 0.32);
      }

      // Service name
      const fontSize = fitFontSize(cfg.font, displayName, W * 0.80, 120, 28);
      ctx.font = cfg.font(fontSize);
      ctx.fillStyle = cfg.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (style === "columbia") {
        ctx.shadowColor = "rgba(0,0,0,0.75)";
        ctx.shadowBlur = 18;
      }
      ctx.fillText(displayName, W / 2, cfg.textY);
      ctx.shadowBlur = 0;

      // Tagline
      if (hasTagline) {
        const tagFontSize = Math.max(14, Math.floor(fontSize * 0.28));
        ctx.font = cfg.font(tagFontSize).replace("300 italic", "300").replace("900", "400").replace("700", "400");
        ctx.fillStyle = style === "columbia" ? "#e8d5a3" : "rgba(255,255,255,0.75)";
        // Columbia: tagline goes on the stairs at the bottom, independent of name position
        const tagY = style === "columbia" ? H * 0.96 : cfg.textY + fontSize * 0.72;
        ctx.fillText(tagline!.trim(), W / 2, tagY);
      }
    }

    return cvs.toDataURL("image/jpeg", 0.95);
  }

  async function generate() {
    if (!name.trim()) return;
    if (keyLoaded && !apiKey) { apiKeyInputRef.current?.focus(); return; }

    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
    setTimings(null);
    setCredits(null);
    setReviewNotes("");
    imageTimeRef.current = 0;
    imageCreditCostRef.current = 0;

    track("Generate", {
      style,
      preset: activePresetRef.current,
      mode: genMode,
      logo_source: logoMode === "upload" ? "upload" : CANVAS_STYLES.has(style) ? "canvas" : "ai",
      image_model: imageModel,
      video_model: videoModel,
      duration: String(duration),
    });

    // Upload mode: image is already known — skip image generation and review entirely
    if (logoMode === "upload") {
      if (!uploadedUri) return; // upload not complete — button should be disabled, but guard anyway
      setImageUrl(uploadedUri);
      if (genMode === "image-only") {
        setStep("done");
        return;
      }
      await proceedToVideo(uploadedUri);
      return;
    }

    // Canvas mode: render logo locally for flat-design styles — no Runway image credits used
    if (CANVAS_STYLES.has(style)) {
      startTimer();
      try {
        setStep("image");
        const imageStart = Date.now();
        const dataUri = await generateCanvasLogo();
        imageTimeRef.current = Date.now() - imageStart;
        await showGeneratedPoster(dataUri);
        if (genMode === "image-only") {
          setTimings({ image: imageTimeRef.current, video: 0 });
          setStep("done");
          return;
        }
        setStep("review");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Canvas render failed");
        setStep("error");
      }
      return;
    }

    // AI generation path
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["x-runway-key"] = apiKey;
    startTimer();

    try {
      setStep("image");
      const imageStart = Date.now();
      const imageRes = await fetch("/api/image", { method: "POST", headers, body: JSON.stringify(buildBody()) });
      const imageData = await imageRes.json();
      if (!imageRes.ok) throw new Error(imageData.error ?? "Image generation failed");
      imageTimeRef.current = Date.now() - imageStart;
      await showGeneratedPoster(imageData.imageUrl);
      imageCreditCostRef.current = imageData.creditCost ?? 0;
      track("Logo Generated", { style, image_model: imageModel });

      if (genMode === "image-only") {
        setTimings({ image: imageTimeRef.current, video: 0 });
        setCredits({ image: imageCreditCostRef.current, video: 0 });
        setStep("done");
        return;
      }

      setStep("review");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setStep("error");
      track("Generation Error", { stage: "image", message: message.slice(0, 200) });
    }
  }

  async function handleRegenerate() {
    if (keyLoaded && !apiKey) { router.push("/setup"); return; }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["x-runway-key"] = apiKey;

    const combined = [customNotes.trim(), reviewNotes.trim()].filter(Boolean).join(". ");

    setImageUrl(null);
    setError(null);
    setReviewNotes("");
    imageTimeRef.current = 0;
    startTimer();
    setStep("image");

    try {
      const imageStart = Date.now();
      const imageRes = await fetch("/api/image", { method: "POST", headers, body: JSON.stringify(buildBody(combined || undefined)) });
      const imageData = await imageRes.json();
      if (!imageRes.ok) throw new Error(imageData.error ?? "Image generation failed");
      imageTimeRef.current = Date.now() - imageStart;
      await showGeneratedPoster(imageData.imageUrl);
      imageCreditCostRef.current = imageData.creditCost ?? 0;
      setStep("review");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setStep("error");
      track("Generation Error", { stage: "regenerate", message: message.slice(0, 200) });
    }
  }

  async function proceedToVideo(imageUrlOverride?: string) {
    const effectiveImageUrl = imageUrlOverride ?? imageUrl;
    if (!effectiveImageUrl || (keyLoaded && !apiKey)) return;
    const jsonHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) jsonHeaders["x-runway-key"] = apiKey;
    const pollHeaders: Record<string, string> = {};
    if (apiKey) pollHeaders["x-runway-key"] = apiKey;

    setError(null);
    setPollStatus(null);
    setPollProgress(null);
    setCancelling(false);
    setCancelError(null);
    startTimer();
    setStep("video");
    track("Video Started", { style, video_model: videoModel, duration: String(duration) });

    // Cancel video aborts with "cancel" (back to the poster, or to the old video on a redo); Start over aborts with "reset".
    const controller = new AbortController();
    cancelControllerRef.current = controller;
    const { signal } = controller;
    const previousVideoUrl = videoUrl;
    function stopIfCancelled() {
      if (!signal.aborted) return false;
      cancelActiveTask();
      if (signal.reason === "cancel") {
        setPollStatus(null);
        setPollProgress(null);
        setCancelling(false);
        setStep(previousVideoUrl ? "done" : "review");
      }
      return true;
    }

    try {
      // Step 1: kick off the Runway task (fast, < 5s)
      setPollStatus("STARTING");
      const videoCombinedNotes = [customNotes.trim(), videoRegenNotes.trim()].filter(Boolean).join(". ");
      const startRes = await fetch("/api/video/start", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ ...buildBody(videoCombinedNotes || undefined), imageUrl: effectiveImageUrl }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error ?? "Failed to start video generation");

      const taskId: string = startData.taskId;
      const videoCreditsBefore: number = startData.creditsBefore ?? 0;
      activeTaskIdRef.current = taskId;
      if (stopIfCancelled()) return;
      const videoStart = Date.now();
      const maxWaitMs = 15 * 60 * 1000; // 15 minutes

      // Step 2: poll every 8s until done (Runway updates no more than every 5s)
      while (Date.now() - videoStart < maxWaitMs) {
        await sleepUnlessAborted(8_000, signal);
        if (stopIfCancelled()) return;

        const pollRes = await fetch(`/api/video/poll?id=${encodeURIComponent(taskId)}`, { headers: pollHeaders });
        const pollData = await pollRes.json();
        if (stopIfCancelled()) return;
        if (!pollRes.ok) throw new Error(pollData.error ?? "Status check failed");

        const { status, output, failure, failureCode, progress, creditsAfter } = pollData;
        setPollStatus(status);
        if (typeof progress === "number") setPollProgress(Math.round(progress * 100));
        else if (status !== "RUNNING") setPollProgress(null);

        if (status === "SUCCEEDED") {
          activeTaskIdRef.current = null;
          const videoTime = Date.now() - videoStart;
          setTimings({ image: imageTimeRef.current, video: videoTime });
          track("Video Generated", { style, video_model: videoModel, duration: String(duration) });
          if (videoCreditsBefore > 0 && typeof creditsAfter === "number") {
            setCredits({ image: imageCreditCostRef.current, video: Math.max(0, videoCreditsBefore - creditsAfter) });
          }
          // Let the bar land at 100% before the video takes over; showIncomingVideo finishes the step once it can play.
          setPollProgress(100);
          await sleepUnlessAborted(150, signal);
          if (signal.aborted && signal.reason === "reset") return;
          setIncomingVideoUrl(output);
          return;
        }
        if (status === "FAILED")    throw new Error(`${failure ?? "Video generation failed"}${failureCode ? ` (${failureCode})` : ""}`);
        if (status === "CANCELLED") throw new Error("Video generation was cancelled");
        // PENDING / THROTTLED / RUNNING → keep polling
      }

      throw new Error("Video generation timed out after 15 minutes. Check your Runway dashboard for task status.");
    } catch (e) {
      if (stopIfCancelled()) return;
      activeTaskIdRef.current = null;
      setPollStatus(null);
      setPollProgress(null);
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setStep("error");
      track("Generation Error", { stage: "video", message: message.slice(0, 200) });
    }
  }

  // The new video can play: it fades in over the skeleton (or over the dimmed old video on a redo), which leaves after the fade.
  function showIncomingVideo() {
    if (!incomingVideoUrl) return;
    setOutgoingVideoUrl(videoUrl);
    setVideoUrl(incomingVideoUrl);
    setIncomingVideoUrl(null);
    setPollStatus(null);
    setPollProgress(null);
    setStep("done");
    setTimeout(() => setOutgoingVideoUrl(null), VIDEO_REVEAL_MS);
  }

  function failIncomingVideo() {
    setIncomingVideoUrl(null);
    setPollStatus(null);
    setPollProgress(null);
    setError("The video was generated but your browser couldn’t load it. Runway’s links expire after a while; try again.");
    setStep("error");
  }

  const generateBlocked = isGenerating || !name.trim() || isUploading || (logoMode === "upload" && !uploadedUri);
  const statusMessage =
    step === "image" ? "Generating the poster"
    : step === "review" ? "Poster ready. Review it, then make the video."
    : step === "video" ? (pollStatus === "THROTTLED" ? "Video queued: another Runway task is still running" : "Generating the video")
    : step === "done" ? (videoUrl ? "Your intro video is ready" : "Your title card is ready")
    : "";
  const activeStyle = STYLES.find(s => s.id === style);
  const ratioLabel = imageRatio(imageModel).replace(":", "×");

  return (
    <main
      id="main-content"
      className="relative flex-1 bg-background text-white flex flex-col items-center overflow-hidden"
    >
      <WebAppJsonLd />
      {/* Film grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.032]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Full-bleed cinematic video hero */}
      <div className="w-full relative" style={{ height: "clamp(220px, 36vw, 500px)" }}>
        <h1 className="sr-only">StreamRoll: AI-generated streaming intros for Plex, Jellyfin, and Emby</h1>
        <VideoMontage />
        {/* design-ok: hero band scrims, kept per DECISIONS.md */}
        <div className="absolute inset-x-0 top-0 pointer-events-none z-10" style={{ height: "35%", background: "linear-gradient(to bottom, #080808 0%, transparent 100%)" }} />
        {/* bottom: dissolves into page */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10" style={{ height: "50%", background: "linear-gradient(to top, #080808 0%, transparent 100%)" }} />
        {/* side vignettes */}
        <div className="absolute inset-y-0 left-0 w-16 pointer-events-none z-10" style={{ background: "linear-gradient(to right, #080808, transparent)" }} />
        <div className="absolute inset-y-0 right-0 w-16 pointer-events-none z-10" style={{ background: "linear-gradient(to left, #080808, transparent)" }} />
      </div>

      {/* Works with + key status, over the bottom fade of the video */}
      <div className="w-full max-w-2xl px-4 -mt-10 z-20 relative flex flex-col items-center gap-2 pb-8 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <span className="text-sm text-neutral-400">Works with</span>
          {PLATFORMS.map((p) => (
            <div key={p.name} className="flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/${p.slug}.svg`} alt="" aria-hidden="true" width={16} height={16} />
              <span className="text-sm font-medium" style={{ color: p.color }}>{p.name}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 text-sm text-neutral-400">
          <span>Community:</span>
          {[
            { href: LINKS.prerollSub, label: "r/plexprerolls" },
            { href: LINKS.plexSub, label: "r/PleX" },
            { href: LINKS.jellyfinSub, label: "r/jellyfin" },
            { href: LINKS.plexForums, label: "Plex Forums" },
          ].map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center whitespace-nowrap underline underline-offset-2 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <p className="text-sm text-neutral-400">No install, no StreamRoll account needed</p>

        {keyLoaded && (
          apiKey
            ? <p className="text-sm text-green-400">Runway API key active</p>
            : <p className="text-sm text-amber-400">Add your Runway API key below to start</p>
        )}
      </div>

      {/* How it works */}
      <section aria-labelledby="how-it-works-heading" className="w-full max-w-2xl px-4 mb-10">
        <h2 id="how-it-works-heading" className="text-base font-semibold text-neutral-200 mb-4">How it works</h2>
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6">
          {([
            { title: "Pick a style", desc: "Name your service and choose a look" },
            { title: "Add a Runway API key", desc: "Creating a key is free; generating uses paid Runway credits" },
            { title: "Generate", desc: "AI builds a title card and an animated intro" },
            { title: "Add to your server", desc: "Drop the MP4 into Plex, Jellyfin, or Emby" },
          ]).map((s, i, arr) => (
            <li key={s.title} className="relative flex flex-col gap-2">
              {i < arr.length - 1 && (
                <div aria-hidden="true" className="hidden sm:block absolute top-3 left-8 right-0 h-px bg-neutral-800" />
              )}
              <div aria-hidden="true" className="relative w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300 shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-200 leading-snug">{s.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed mt-0.5">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="w-full max-w-2xl px-4 space-y-10">

        {/* Name & tagline */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="service-name" className="block text-sm font-medium text-neutral-300 mb-2">Service name</label>
            <input
              id="service-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Joeflix, Cinema Corner, The Movie Vault"
              maxLength={30}
              disabled={isGenerating}
              className={INPUT_CLASS}
            />
            <div className="flex justify-between mt-1">
              <span className="text-sm text-neutral-400">Short names render best</span>
              <span className={`text-sm tabular-nums ${name.length > 18 ? "text-amber-500" : "text-neutral-400"}`}>{name.length}/30</span>
            </div>
          </div>
          <div>
            <label htmlFor="tagline" className="block text-sm font-medium text-neutral-300 mb-2">
              Tagline <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                id="tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Where stories come alive"
                maxLength={60}
                disabled={isGenerating}
                className={`${INPUT_CLASS} pr-12`}
              />
              <button
                type="button"
                onClick={shuffleTagline}
                disabled={isGenerating}
                aria-label="Shuffle tagline"
                title="Shuffle tagline"
                className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white transition-colors disabled:opacity-40 text-base leading-none focus-visible:outline-2 focus-visible:outline-white"
              >
                <span aria-hidden="true">↺</span>
              </button>
            </div>
          </div>
        </section>

        {/* Style */}
        <section aria-labelledby="style-heading">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 id="style-heading" className="text-sm font-medium text-neutral-300">
              {logoMode === "upload" ? "Motion style" : "Style"}
            </h2>
            <button
              type="button"
              onClick={() => applyInspo(INSPO[Math.floor(Math.random() * INSPO.length)])}
              disabled={isGenerating}
              className="min-h-11 px-3 text-sm text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-lg transition-colors disabled:opacity-40"
            >
              Surprise me
            </button>
          </div>
          <div role="group" aria-labelledby="style-heading" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {STYLES.map((s, i) => (
              <ThemeTile
                key={s.id}
                label={s.label}
                desc={s.desc}
                image={s.image!}
                eager={i < 4}
                active={style === s.id && name !== "My Service"}
                color={STYLE_COLOR[s.id]}
                disabled={isGenerating}
                onClick={() => {
                  activePresetRef.current = "direct";
                  setStyle(s.id);
                  const d = STYLE_DEFAULTS[s.id];
                  setVideoModel(d.videoModel);
                  setImageModel(d.imageModel);
                  setTreatment(d.treatment);
                  setDuration(d.duration);
                }}
              />
            ))}
            <ThemeTile
              label="Blank Slate"
              desc="Cinematic base, your name and brand"
              image="/previews/blank-slate.jpg"
              active={name === "My Service" && style === "cinematic"}
              color={STYLE_COLOR.cinematic}
              disabled={isGenerating}
              onClick={() => applyInspo({ name: "My Service", style: "cinematic", tagline: "", desc: "Blank Slate", vibe: "Cinematic base, your name and brand", image: "/previews/blank-slate.jpg", customNotes: "" })}
            />
          </div>
          {activeStyle && (
            <p className="mt-2 text-sm text-neutral-400">
              <span className="text-neutral-200">{activeStyle.label}:</span> {activeStyle.desc}. {activeStyle.tip}
            </p>
          )}

          <button
            type="button"
            aria-expanded={showThemes}
            aria-controls="more-themes"
            onClick={() => setShowThemes((v) => !v)}
            className="mt-6 min-h-11 inline-flex items-center gap-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
          >
            <span aria-hidden="true" className={`inline-block text-neutral-400 transition-transform ${showThemes ? "rotate-90" : ""}`}>▸</span>
            More themes
          </button>
          <Collapsible id="more-themes" open={showThemes}>
            <div className="pt-3 space-y-6">
              {([
                { id: "seasonal", title: "Seasonal", presets: SEASONAL },
                { id: "holidays", title: "Holidays", presets: HOLIDAYS },
                { id: "studios", title: "Classic studios", presets: STUDIOS },
              ]).map((group) => {
                const activePreset = group.presets.find((p) => name === p.name && style === p.style);
                return (
                  <section key={group.id} aria-labelledby={`${group.id}-heading`}>
                    <h3 id={`${group.id}-heading`} className="text-sm font-medium text-neutral-300 mb-2">{group.title}</h3>
                    <div role="group" aria-labelledby={`${group.id}-heading`} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {group.presets.map((p) => (
                        <ThemeTile
                          key={p.name}
                          label={p.desc}
                          desc={p.vibe}
                          image={p.image!}
                          active={p === activePreset}
                          color={STYLE_COLOR[p.style]}
                          disabled={isGenerating}
                          onClick={() => applyInspo(p)}
                        />
                      ))}
                    </div>
                    {activePreset && (
                      <p className="mt-2 text-sm text-neutral-400">
                        <span className="text-neutral-200">{activePreset.desc}:</span> {activePreset.vibe}
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          </Collapsible>
        </section>

        {/* Duration */}
        <section aria-labelledby="duration-heading">
          <h2 id="duration-heading" className="text-sm font-medium text-neutral-300 mb-3">Duration</h2>
          <div role="group" aria-labelledby="duration-heading" className="flex gap-2">
            {activeDurations.map((d) => {
              const active = duration === d.value;
              return (
                <button
                  type="button"
                  key={d.value}
                  aria-pressed={active}
                  onClick={() => setDuration(d.value)}
                  disabled={isGenerating}
                  className="flex-1 min-w-0 flex flex-col items-center gap-1 py-3 rounded-lg border text-xs transition-colors disabled:opacity-50"
                  style={active
                    ? { borderColor: accentColor, backgroundColor: accentColor + "15" }
                    : { borderColor: "#262626" }
                  }
                >
                  <span className="text-base font-bold" style={active ? { color: accentColor } : { color: "#e5e7eb" }}>
                    {active && <span aria-hidden="true">✓ </span>}{d.label}
                  </span>
                  <span className="text-neutral-400 whitespace-nowrap">
                    {d.value * crPerSec + imageCrCost} cr<span className="hidden sm:inline">, {d.est}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Advanced settings */}
        <section aria-labelledby="advanced-heading">
          <h2 id="advanced-heading">
            <button
              type="button"
              aria-expanded={showAdvanced}
              aria-controls="advanced-settings"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full min-h-11 flex items-center justify-between gap-3 text-left text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              <span>Advanced settings</span>
              <span aria-hidden="true" className={`inline-block text-neutral-400 transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▸</span>
            </button>
          </h2>
          <p className="text-sm text-neutral-400">Each style sets recommended defaults; change them here.</p>

          <Collapsible id="advanced-settings" open={showAdvanced}>
            <div className="space-y-7 pt-5">

              {/* Image model */}
              <div>
                <h3 id="image-model-heading" className="text-sm font-medium text-neutral-300 mb-3">Image model</h3>
                <div role="group" aria-labelledby="image-model-heading" className="space-y-1.5">
                  {(["Runway", "OpenAI", "Google"] as const).map((group) => {
                    const models = IMAGE_MODELS.filter(m => m.group === group);
                    if (!models.length) return null;
                    return (
                      <div key={group}>
                        <div className="text-sm text-neutral-400 mb-2">{group === "OpenAI" ? "OpenAI via Runway" : group === "Google" ? "Google via Runway" : "Runway"}</div>
                        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
                          {models.map((m) => (
                            <ModelOption key={m.id} label={m.label} cost={m.crInfo} desc={m.desc} active={imageModel === m.id} accentColor={accentColor} disabled={isGenerating} onClick={() => setImageModel(m.id)} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Video model */}
              <div>
                <h3 id="video-model-heading" className="text-sm font-medium text-neutral-300 mb-3">Video model</h3>
                <div role="group" aria-labelledby="video-model-heading" className="space-y-1.5">
                  {(["Runway", "Google"] as const).map((group) => (
                    <div key={group}>
                      <div className="text-sm text-neutral-400 mt-3 mb-2">{group === "Google" ? "Google via Runway" : "Runway"}</div>
                      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 gap-2">
                        {VIDEO_MODELS.filter((m) => m.group === group).map((m) => (
                          <ModelOption
                            key={m.id}
                            label={m.label}
                            cost={m.crInfo}
                            desc={m.desc}
                            note={STYLE_DEFAULTS[style].videoModel === m.id ? "Recommended" : undefined}
                            active={videoModel === m.id}
                            accentColor={accentColor}
                            disabled={isGenerating}
                            onClick={() => handleModelChange(m.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audio toggle — Veo models only */}
                {isVeoModel && (
                  <div
                    className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-lg border"
                    style={{ borderColor: "#262626" }}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-300">Generate audio</div>
                      <div className="text-sm text-neutral-400 mt-0.5">Veo can auto-generate ambient sound &amp; music</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={audio}
                      onClick={() => setAudio((v) => !v)}
                      disabled={isGenerating}
                      aria-label="Generate audio"
                      className="relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 shrink-0"
                      style={{ backgroundColor: audio ? accentColor : "#404040" }}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${audio ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                )}
              </div>

              {/* Card treatment */}
              <div>
                <h3 id="treatment-heading" className="text-sm font-medium text-neutral-300 mb-3">Card treatment</h3>
                <div role="group" aria-labelledby="treatment-heading" className="flex gap-2">
                  {TREATMENTS.map((t) => {
                    const active = treatment === t.id;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        aria-pressed={active}
                        onClick={() => setTreatment(t.id)}
                        disabled={isGenerating}
                        className="flex-1 min-w-0 flex flex-col items-start px-3 py-2.5 rounded-lg border text-sm text-left transition-colors disabled:opacity-50"
                        style={active
                          ? { borderColor: accentColor, backgroundColor: accentColor + "15" }
                          : { borderColor: "#262626" }
                        }
                      >
                        <span className={`mb-0.5 ${active ? "font-semibold" : "font-medium"}`} style={active ? { color: accentColor } : { color: "#e5e7eb" }}>
                          {active && <span aria-hidden="true">✓ </span>}{t.label}
                        </span>
                        <span className="text-neutral-400">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary color */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 id="primary-color-heading" className="text-sm font-medium text-neutral-300">
                    Primary color <span className="text-neutral-400 font-normal">(optional)</span>
                  </h3>
                  {primaryColor && (
                    <button type="button" onClick={() => setPrimaryColor(null)} className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors">Clear</button>
                  )}
                </div>
                <div role="group" aria-labelledby="primary-color-heading" className="flex flex-wrap items-center gap-1">
                  {COLOR_SWATCHES.map((c) => {
                    const active = primaryColor === c.value;
                    return (
                      <button
                        type="button"
                        key={c.value}
                        aria-pressed={active}
                        onClick={() => setPrimaryColor(active ? null : c.value)}
                        disabled={isGenerating}
                        aria-label={c.label}
                        title={c.label}
                        className="w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-50"
                      >
                        <span
                          aria-hidden="true"
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            backgroundColor: c.value,
                            color: c.label === "White" ? "#000" : "#fff",
                            outline: active ? `2px solid ${c.value}` : undefined,
                            outlineOffset: 2,
                          }}
                        >
                          {active && "✓"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom notes */}
              <div>
                <label htmlFor="custom-details" className="block text-sm font-medium text-neutral-300 mb-2">
                  Custom details <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <input
                  id="custom-details"
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder='e.g. "wolf mascot", "slow burn reveal", "HBO Max aesthetic"'
                  maxLength={120}
                  disabled={isGenerating}
                  className={INPUT_CLASS}
                />
              </div>

            </div>
          </Collapsible>
        </section>

        {/* Prompt preview */}
        <section aria-labelledby="prompt-heading">
          <h2 id="prompt-heading">
            <button
              type="button"
              aria-expanded={showPrompt}
              aria-controls="prompt-preview"
              onClick={() => setShowPrompt((v) => !v)}
              className="w-full min-h-11 flex items-center justify-between gap-3 text-left text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              <span>Prompt preview</span>
              <span aria-hidden="true" className={`inline-block text-neutral-400 transition-transform ${showPrompt ? "rotate-90" : ""}`}>▸</span>
            </button>
          </h2>
          <p className="text-sm text-neutral-400">See and edit what gets sent to the AI.</p>
          <Collapsible id="prompt-preview" open={showPrompt}>
            <div className="space-y-3 pt-4">
              <EditablePromptBlock
                label="Step 1: title card"
                meta={`${IMAGE_MODELS.find(m => m.id === imageModel)?.label ?? imageModel}, ${ratioLabel}`}
                generated={preview.imagePrompt}
                override={imagePromptOverride}
                onChange={setImagePromptOverride}
              />
              <EditablePromptBlock
                label="Step 2: video"
                meta={`${videoModel}, 1280×720${isVeoModel && audio ? ", audio on" : ""}`}
                generated={preview.videoPrompt}
                override={videoPromptOverride}
                onChange={setVideoPromptOverride}
              />
              {gen3aTurboPromptTooLong && (
                <p className="text-sm text-amber-500">
                  Gen3a Turbo has a 768-character prompt limit. This video prompt is {(videoPromptOverride ?? preview.videoPrompt).length} characters. Switch to Gen4 Turbo or shorten custom notes to avoid an API error.
                </p>
              )}
            </div>
          </Collapsible>
        </section>

        {/* Logo source */}
        <section aria-labelledby="title-card-heading">
          <h2 id="title-card-heading" className="text-sm font-medium text-neutral-300 mb-3">Title card</h2>
          <div role="group" aria-labelledby="title-card-heading" className="flex gap-2">
            {(["ai", "upload"] as LogoMode[]).map((m) => (
              <button
                type="button"
                key={m}
                aria-pressed={logoMode === m}
                onClick={() => { setLogoMode(m); setUploadError(null); }}
                disabled={isGenerating}
                className={`flex-1 min-h-11 py-2.5 rounded-lg border text-sm transition-colors disabled:opacity-50 ${logoMode === m ? "font-semibold" : "font-medium"}`}
                style={logoMode === m
                  ? { borderColor: accentColor, backgroundColor: accentColor + "15", color: accentColor }
                  : { borderColor: "#262626", color: "#a3a3a3" }
                }
              >
                {logoMode === m && <span aria-hidden="true">✓ </span>}
                {m === "ai" ? "Generate with AI" : "Upload your own"}
              </button>
            ))}
          </div>

          {logoMode === "upload" && (
            <div className="mt-4">
              <label
                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-white has-[:focus-visible]:outline-offset-2"
                style={{ borderColor: uploadError ? "#ef4444" : uploadedUri ? accentColor + "60" : "#404040", backgroundColor: uploadedUri ? accentColor + "08" : "transparent" }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0];
                  if (f && !isGenerating && !isUploading) handleFileUpload(f);
                }}
              >
                {uploadPreview ? (
                  <div className="relative w-full h-full">
                    <Image src={uploadPreview} alt="Uploaded logo" fill className="object-contain p-3 rounded-xl" unoptimized />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                        <span className="text-sm text-white">Uploading to Runway…</span>
                      </div>
                    )}
                    {uploadedUri && !isUploading && (
                      <div className="absolute top-2 right-2 text-sm px-2 py-0.5 rounded" style={{ background: "#000", color: accentColor }}>
                        Ready
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <div className="text-sm text-neutral-300">Drop your title card image here or click to browse</div>
                    <div className="text-sm text-neutral-400 mt-1">PNG, JPG or WebP, up to 3 MB, at most 2.36:1 (16:9 or squarer)</div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  aria-label={uploadedUri ? "Replace uploaded title card" : "Upload your title card image"}
                  className="sr-only"
                  disabled={isGenerating || isUploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                />
              </label>
              {uploadError && (
                <p role="alert" className="mt-2 text-sm text-red-400">{uploadError}</p>
              )}
            </div>
          )}
        </section>

        {/* Generation mode — AI path only */}
        {logoMode === "ai" && (
          <div role="group" aria-label="What to generate" className="flex gap-2">
            {(["image-only", "full"] as GenMode[]).map((m) => (
              <button
                type="button"
                key={m}
                aria-pressed={genMode === m}
                onClick={() => setGenMode(m)}
                disabled={isGenerating}
                className="flex-1 min-w-0 py-3 px-3 rounded-lg border text-left transition-colors disabled:opacity-50"
                style={genMode === m
                  ? { borderColor: accentColor, backgroundColor: accentColor + "15", color: accentColor }
                  : { borderColor: "#262626", color: "#a3a3a3" }
                }
              >
                <div className={`text-sm ${genMode === m ? "font-semibold" : "font-medium"}`}>
                  {genMode === m && <span aria-hidden="true">✓ </span>}
                  {m === "image-only" ? "Title card only" : "Full intro"}
                </div>
                <div className="text-sm mt-0.5 text-neutral-400">
                  {m === "image-only"
                    ? "Generate the title card, then choose what to do next"
                    : "Title card and animated video, start to finish"}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Audio track — queue before generating, mixed in after video is done */}
        {(genMode === "full" || logoMode === "upload") && (
          <section aria-labelledby="audio-track-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="audio-track-heading" className="text-sm font-medium text-neutral-300">
                Audio track <span className="text-neutral-400 font-normal">(optional)</span>
              </h2>
              {pendingAudioFile && (
                <button
                  type="button"
                  onClick={() => {
                    if (pendingAudioPreviewUrl) URL.revokeObjectURL(pendingAudioPreviewUrl);
                    setPendingAudioFile(null);
                    setPendingAudioPreviewUrl(null);
                  }}
                  className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {!pendingAudioFile ? (
              <label
                className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-neutral-500 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-white has-[:focus-visible]:outline-offset-2"
                style={{ borderColor: "#404040" }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type.startsWith("audio/")) {
                    setPendingAudioFile(f);
                    setPendingAudioPreviewUrl(URL.createObjectURL(f));
                  }
                }}
              >
                <div className="text-center px-4">
                  <div className="text-sm text-neutral-300">Drop an audio file or click to browse</div>
                  <div className="text-sm text-neutral-400 mt-0.5">MP3, WAV, AAC, OGG, FLAC or M4A, mixed in after the video generates</div>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  disabled={isGenerating}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setPendingAudioFile(f);
                      setPendingAudioPreviewUrl(URL.createObjectURL(f));
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            ) : (
              <div className="flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-neutral-300 truncate">{pendingAudioFile.name}</div>
                  <div className="text-sm text-neutral-400 mt-0.5">
                    {pendingAudioFile.size < 1048576
                      ? `${Math.round(pendingAudioFile.size / 1024)} KB`
                      : `${(pendingAudioFile.size / 1048576).toFixed(1)} MB`}
                    {", ready to mix after the video generates"}
                  </div>
                </div>
                {pendingAudioPreviewUrl && (
                  <audio
                    src={pendingAudioPreviewUrl}
                    controls
                    aria-label={`Preview ${pendingAudioFile.name}`}
                    className="h-8 w-40 shrink-0"
                    style={{ colorScheme: "dark" }}
                  />
                )}
              </div>
            )}
          </section>
        )}

        {/* Inline API key entry */}
        {keyLoaded && (
          <section>
            {apiKey ? (
              <div
                ref={apiKeyStatusRef}
                tabIndex={-1}
                className="flex items-center gap-3 px-3 py-1 rounded-lg border focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                style={{ borderColor: "#14532d", backgroundColor: "#052e1620" }}
              >
                <p role="status" className="text-sm text-green-400 flex-1">
                  {apiKeySaved ? "Key saved. You’re ready to generate." : "Runway API key active"}
                </p>
                <button type="button" onClick={removeApiKey} className="min-h-11 px-2 text-sm text-neutral-300 hover:text-white transition-colors shrink-0">
                  Remove key
                </button>
              </div>
            ) : (
              <form
                className="space-y-2"
                onSubmit={(e) => { e.preventDefault(); saveApiKeyFromInput(); }}
              >
                <label htmlFor="runway-api-key" className="block text-sm font-medium text-neutral-300">
                  Runway API key <span className="text-neutral-400 font-normal">(required to generate)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="runway-api-key"
                    ref={apiKeyInputRef}
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="key_••••••••••••••••••••••"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    className={`${INPUT_CLASS} flex-1 min-w-0 font-mono`}
                  />
                  <button
                    type="submit"
                    disabled={!apiKeyInput.trim()}
                    className={`min-h-11 px-4 rounded-lg text-sm font-semibold bg-white text-black hover:bg-neutral-200 ${PRESS} disabled:opacity-40 disabled:cursor-not-allowed shrink-0`}
                  >
                    Save
                  </button>
                </div>
                <label className="flex items-center gap-2 min-h-11 w-fit cursor-pointer text-sm text-neutral-300">
                  <input
                    type="checkbox"
                    checked={rememberKey}
                    onChange={(e) => setRememberKey(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Remember this key on this device
                </label>
                <p className="text-sm text-neutral-400 max-w-[65ch]">
                  Your key stays in your browser. Each request passes it through this site’s server to Runway; the server never saves or logs it. Unchecked, the key is forgotten when you close this tab.{" "}
                  <a href={LINKS.runwayApiKeys} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white transition-colors">Get a Runway API key</a>
                </p>
              </form>
            )}
          </section>
        )}

        {/* Credit cost estimate */}
        {!isGenerating && name.trim() && apiKey && (
          <p className="text-sm text-neutral-400 text-center -mb-6">
            {logoMode === "upload"
              ? `~${crPerSec * duration} Runway credits for the animated video`
              : genMode === "image-only"
              ? `~${imageCrCost} Runway credits for the title card`
              : `~${imageCrCost + crPerSec * duration} Runway credits total`}
          </p>
        )}

        {/* Generate */}
        <button
          type="button"
          onClick={generate}
          disabled={generateBlocked}
          className={`w-full min-h-11 font-semibold py-3.5 rounded-lg ${PRESS} disabled:cursor-not-allowed text-base bg-white text-black hover:bg-neutral-200 tabular-nums ${isGenerating ? "" : "disabled:opacity-40"}`}
        >
          {isGenerating
            ? <>Generating… <ElapsedSeconds since={genStartedAt} /></>
            : isUploading
            ? "Uploading…"
            : keyLoaded && !apiKey
            ? "Add your API key above to generate"
            : logoMode === "upload" && !uploadedUri
            ? "Upload a title card first"
            : logoMode === "upload"
            ? "Animate my title card"
            : genMode === "image-only"
            ? "Generate title card"
            : "Generate intro"}
        </button>

        {/* Disabled reason hint */}
        {keyLoaded && !isGenerating && (!name.trim() || (logoMode === "upload" && !uploadedUri)) && (
          <p className="text-sm text-center text-neutral-400 -mt-7">
            {!name.trim()
              ? "Enter a service name above to continue"
              : "Upload a title card image above to continue"}
          </p>
        )}
      </div>

      {/* One live region for generation progress; errors use role="alert" below */}
      <p role="status" className="sr-only">{statusMessage}</p>

      {/* Progress + results */}
      {(isGenerating || step === "review" || step === "done" || (step === "error" && imageUrl)) && (
        <section aria-labelledby="result-heading" ref={resultRef} tabIndex={-1} className="mt-12 w-full max-w-2xl px-4 focus:outline-none">
          <h2 id="result-heading" className="sr-only">Your intro</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
            <StepIndicator label="Scene 1: Design poster" status={step === "image" ? "active" : "done"} color={accentColor} />
            {genMode === "full" && (
              <>
                <div className="flex-1 min-w-6 h-px bg-neutral-800" />
                <StepIndicator
                  label="Scene 2: Roll camera"
                  status={step === "video" ? "active" : step === "done" ? "done" : step === "error" ? "error" : "pending"}
                  color={accentColor}
                />
              </>
            )}
            {step === "video" && pollStatus !== "SUCCEEDED" && (
              <button
                type="button"
                onClick={handleCancelVideo}
                disabled={cancelling}
                className="min-h-11 px-2 text-sm text-red-400 hover:text-red-300 transition-colors shrink-0 disabled:text-neutral-400 disabled:cursor-not-allowed"
              >
                {cancelling ? "Cancelling…" : "Cancel video"}
              </button>
            )}
            {!isGenerating && (
              confirmingReset ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-sm text-neutral-400">Video will be lost:</span>
                  <button type="button" onClick={reset} className="min-h-11 px-2 text-sm text-red-400 hover:text-red-300 transition-colors">Confirm</button>
                  <button type="button" onClick={() => setConfirmingReset(false)} className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors">Cancel</button>
                </div>
              ) : step === "error" && imageUrl && !videoUrl ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => proceedToVideo()} className="min-h-11 px-2 text-sm text-white hover:text-neutral-300 transition-colors">
                    Try again
                  </button>
                  <button type="button" onClick={safeReset} className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors">
                    Start over
                  </button>
                </div>
              ) : (
                <button type="button" onClick={safeReset} className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors shrink-0">
                  Start over
                </button>
              )
            )}
          </div>

          <div className="space-y-4">
            {cancelError && (
              <p role="alert" className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">{cancelError}</p>
            )}

            {/* Image skeleton */}
            {step === "image" && !imageUrl && logoMode === "ai" && (
              <div className="rounded-xl overflow-hidden border border-neutral-800">
                <div className="w-full bg-neutral-900" style={{ aspectRatio: "16/9" }} />
                <div className="px-3 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center gap-3">
                  <ProgressBar label="Generating poster" value={null} color={accentColor} className="flex-1" />
                  <span className="text-sm text-neutral-400 shrink-0">Generating poster…</span>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="rounded-xl overflow-hidden border border-neutral-800">
                <div className="px-3 text-sm text-neutral-400 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-2">
                  <span>Scene 1: Logo, {ratioLabel}</span>
                  <div className="flex items-center gap-3">
                    {timings && timings.image > 0 && <span className="tabular-nums">{(timings.image / 1000).toFixed(1)}s</span>}
                    <button
                      type="button"
                      onClick={downloadPoster}
                      className="min-h-11 px-2 text-sm text-neutral-300 hover:text-white transition-colors"
                    >
                      Download poster
                    </button>
                  </div>
                </div>
                <Image
                  src={imageUrl}
                  alt="Generated logo"
                  width={1920}
                  height={1080}
                  className={`w-full ${revealPoster ? "[clip-path:inset(0)] starting:[clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-400 ease-enter" : ""}`}
                  unoptimized
                />
                {posterDownloadError && (
                  <p role="alert" className="px-3 py-2 text-sm text-red-300 bg-red-950 border-t border-red-900">{posterDownloadError}</p>
                )}
              </div>
            )}

            {/* Logo-only done — offer to continue to video */}
            {step === "done" && genMode === "image-only" && imageUrl && (
              <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: accentColor + "50", background: accentColor + "0a" }}>
                <div>
                  <p className="text-base font-semibold text-white">Happy with the logo?</p>
                  <p className="text-sm text-neutral-300 mt-1">Animate it into a full streaming intro, or download the poster above.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setGenMode("full"); proceedToVideo(); }}
                  className={`w-full py-3.5 rounded-lg text-sm font-semibold text-black ${PRESS}`}
                  style={{ background: accentColor }}
                >
                  Animate into a video intro
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="w-full min-h-11 rounded-lg text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Start over with a new style
                </button>
              </div>
            )}

            {/* Review step — approve or regenerate before animating */}
            {step === "review" && genMode === "full" && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
                <p className="text-sm font-medium text-neutral-200">Happy with the logo?</p>
                <p className="text-sm text-neutral-400">Approve it to animate, or add notes and regenerate.</p>
                <div>
                  <label htmlFor="review-notes" className="block text-sm text-neutral-300 mb-1.5">Notes for a new version (optional)</label>
                  <input
                    id="review-notes"
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    onKeyDown={(e) => { if (isEnterToSubmitNotes(e, reviewNotes)) handleRegenerate(); }}
                    placeholder='e.g. "make text bolder", "brighter red", "less grain"'
                    className={`${INPUT_CLASS} bg-neutral-950`}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    className="min-h-11 px-4 rounded-lg border border-neutral-700 text-sm text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
                  >
                    Start over
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="flex-1 min-h-11 px-4 rounded-lg border border-neutral-700 text-sm text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={() => proceedToVideo()}
                    className={`flex-1 min-h-11 px-4 rounded-lg text-sm font-semibold text-black whitespace-nowrap ${PRESS}`}
                    style={{ background: accentColor }}
                  >
                    Looks good, make the video
                  </button>
                </div>
              </div>
            )}

            {/* Video: progress, then the new video fading in over the skeleton, or over the dimmed old one on a redo */}
            {(step === "video" || videoUrl) && (
              <div className="rounded-xl overflow-hidden border border-neutral-800">
                {step === "video" ? (
                  // Status bar (announced via the page's status region, not here); same height as the header it replaces
                  <div className="px-3 py-2 min-h-9 bg-neutral-900 border-b border-neutral-800 flex items-center gap-3">
                    <ProgressBar label="Video progress" value={pollProgress} color={accentColor} className="flex-1" />
                    <span className="text-sm shrink-0 tabular-nums" style={{ color: pollStatus === "RUNNING" ? "#22C55E" : pollStatus === "THROTTLED" ? "#F59E0B" : "#a3a3a3" }}>
                      {(pollStatus === null || pollStatus === "STARTING") && "Submitting task…"}
                      {pollStatus === "PENDING"   && "Queued, waiting to start"}
                      {pollStatus === "RUNNING"   && `Generating frames${pollProgress !== null ? ` ${pollProgress}%` : "…"}`}
                      {pollStatus === "THROTTLED" && "Throttled: concurrent task limit reached"}
                      {pollStatus === "SUCCEEDED" && "Loading video…"}
                    </span>
                  </div>
                ) : (
                  <div className="px-3 py-2 min-h-9 text-sm text-neutral-400 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-2">
                    <span>Scene 2: Intro video, {duration}s, 1280×720</span>
                    {timings && <span className="tabular-nums">{(timings.video / 1000).toFixed(1)}s</span>}
                  </div>
                )}
                <div className="relative aspect-video bg-neutral-900">
                  {[outgoingVideoUrl, videoUrl, incomingVideoUrl].map((url) => url && (
                    <video
                      key={url}
                      ref={url === videoUrl ? currentVideoRef : undefined}
                      src={url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls={url === videoUrl && step !== "video"}
                      onLoadedData={url === incomingVideoUrl ? showIncomingVideo : undefined}
                      onError={url === incomingVideoUrl ? failIncomingVideo : undefined}
                      className={`absolute inset-0 w-full h-full bg-black transition-opacity duration-400 ease-enter ${
                        url === incomingVideoUrl ? "opacity-0" : url === videoUrl && step !== "video" ? "opacity-100" : "opacity-40"
                      }`}
                    />
                  ))}
                </div>
                {pollStatus === "THROTTLED" && (
                  <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 bg-neutral-900 border-t border-neutral-800">
                    <p className="text-sm text-neutral-300 text-center max-w-sm">
                      Another task is still running on your Runway account (concurrency limit: 1).
                      Copy a task ID from your{" "}
                      <span className="text-white">Runway dev portal, Request History</span>
                      {" "}and cancel it here, or cancel this queued task and try again later.
                    </p>

                    {/* Cancel-by-ID input */}
                    <div className="flex gap-2 w-full max-w-sm">
                      <input
                        type="text"
                        value={cancelTaskId}
                        onChange={e => { setCancelTaskId(e.target.value); setCancelMsg(null); }}
                        placeholder="Paste task ID to cancel…"
                        aria-label="Runway task ID to cancel"
                        className={`${INPUT_CLASS} flex-1 min-w-0`}
                      />
                      <button
                        type="button"
                        disabled={!cancelTaskId.trim()}
                        onClick={async () => {
                          setCancelMsg("Cancelling…");
                          try {
                            await cancelRunwayTask(cancelTaskId.trim());
                            setCancelMsg("Cancelled. Polling will resume shortly.");
                            setCancelTaskId("");
                          } catch (e) {
                            setCancelMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
                          }
                        }}
                        className="min-h-11 text-sm px-3 rounded-lg border border-amber-700 text-amber-400 hover:bg-amber-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      >
                        Cancel task
                      </button>
                    </div>
                    {cancelMsg && (
                      <p role="status" className="text-sm" style={{ color: cancelMsg.startsWith("Error") ? "#EF4444" : "#22C55E" }}>
                        {cancelMsg}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={reset}
                      className="min-h-11 text-sm text-neutral-300 hover:text-white transition-colors"
                    >
                      Cancel this queued task and start over
                    </button>
                  </div>
                )}
                {videoUrl && (
                  // Kept in place, but unusable, while a redo runs, so nothing collapses under the pointer
                  <div inert={step === "video"} className={`transition-opacity ${step === "video" ? "opacity-50" : ""}`}>
                    {/* Timing + cost strip */}
                    {timings && (
                      <div className="px-3 py-1.5 bg-neutral-950 border-b border-neutral-800 flex gap-x-4 gap-y-1 text-sm text-neutral-400 tabular-nums flex-wrap">
                        <span>Scene 1: {(timings.image / 1000).toFixed(1)}s</span>
                        <span>Scene 2: {(timings.video / 1000).toFixed(1)}s</span>
                        <span className="text-neutral-300 font-medium">Total: {((timings.image + timings.video) / 1000).toFixed(1)}s</span>
                        <span className="ml-auto flex flex-wrap gap-x-3">
                          {(credits ? credits.image : imageCrCost) > 0 && (
                            <span>Poster: {credits ? `${credits.image} cr` : `~${imageCrCost} cr`}</span>
                          )}
                          {(credits?.video ?? 0) > 0 || !credits ? (
                            <span>Video: {credits ? `${credits.video} cr` : `~${crPerSec * duration} cr`}</span>
                          ) : null}
                          <span className="text-neutral-300 font-medium">
                            Total: {credits
                              ? `${credits.image + credits.video} cr`
                              : `~${imageCrCost + crPerSec * duration} cr`}
                          </span>
                        </span>
                      </div>
                    )}
                    <div className="px-3 py-2 bg-neutral-950 border-t border-neutral-800">
                      <label htmlFor="redo-notes" className="block text-sm text-neutral-300 mb-1.5">Notes for a redo (optional)</label>
                      <input
                        id="redo-notes"
                        type="text"
                        value={videoRegenNotes}
                        onChange={(e) => setVideoRegenNotes(e.target.value)}
                        onKeyDown={(e) => { if (isEnterToSubmitNotes(e, videoRegenNotes)) proceedToVideo(); }}
                        placeholder='e.g. "more energy", "darker background", "slower reveal"'
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="px-3 py-2 bg-neutral-900 border-t border-neutral-800 flex flex-wrap items-center gap-2">
                      {confirmingReset ? (
                        <>
                          <span className="text-sm text-neutral-300 shrink-0">Video will be lost:</span>
                          <button type="button" onClick={reset} className="min-h-11 text-sm text-red-400 border border-red-900 hover:border-red-700 px-4 rounded transition-colors shrink-0">
                            Confirm
                          </button>
                          <button type="button" onClick={() => setConfirmingReset(false)} className="min-h-11 text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 rounded transition-colors shrink-0">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={safeReset} className="min-h-11 text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 rounded transition-colors shrink-0">
                          Start over
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => proceedToVideo()}
                        className="min-h-11 text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 rounded transition-colors shrink-0"
                      >
                        Redo video
                      </button>
                      <a
                        href={redditShareUrl(name.trim())}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track("Share Reddit", { style })}
                        className="inline-flex items-center min-h-11 text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 rounded transition-colors"
                      >
                        Post to r/plexprerolls
                      </a>
                      <a
                        href={tweetShareUrl(name.trim())}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track("Share X", { style })}
                        className="inline-flex items-center min-h-11 text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 rounded transition-colors"
                      >
                        Share on X
                      </a>
                      <button
                        type="button"
                        onClick={downloadVideo}
                        className={`min-h-11 text-sm text-black font-medium px-4 rounded ${PRESS}`}
                        style={{ background: accentColor }}
                      >
                        Download MP4
                      </button>
                    </div>
                    {downloadError && (
                      <p role="alert" className="px-3 py-2 text-sm text-red-300 bg-red-950 border-t border-red-900">{downloadError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Video generation error, with the poster (and any earlier video) still on screen */}
            {step === "error" && error && (
              <div role="alert" className="rounded-lg border border-red-800 bg-red-950 px-4 py-4 space-y-3">
                <p className="text-sm text-red-300">{error}</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => proceedToVideo()}
                    className="min-h-11 px-4 rounded-lg text-sm font-semibold text-black bg-white hover:bg-neutral-200 transition-colors"
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={safeReset}
                    className="min-h-11 px-2 text-sm text-red-300 hover:text-red-200 transition-colors"
                  >
                    Start over
                  </button>
                </div>
              </div>
            )}

            {/* Audio mixer */}
            {videoUrl && (
              <AudioMixer
                videoUrl={videoUrl}
                name={name}
                style={style}
                accentColor={accentColor}
                duration={duration}
                initialFile={pendingAudioFile ?? undefined}
              />
            )}

            {/* Install guide */}
            {videoUrl && (
              <div className="rounded-xl border border-neutral-800 overflow-hidden">
                <h3>
                  <button
                    type="button"
                    aria-expanded={showInstall}
                    aria-controls="install-guide"
                    onClick={() => setShowInstall((v) => !v)}
                    className="w-full min-h-11 flex items-center justify-between gap-3 px-4 py-3 bg-neutral-900 text-left text-sm text-neutral-300 hover:text-white transition-colors"
                  >
                    <span>How to add this to your media server</span>
                    <span aria-hidden="true" className={`inline-block text-neutral-400 transition-transform ${showInstall ? "rotate-90" : ""}`}>▸</span>
                  </button>
                </h3>
                <Collapsible id="install-guide" open={showInstall}>
                  <div className="divide-y divide-neutral-800">
                    {PLATFORMS.map((p) => (
                      <div key={p.name} className="px-4 py-3 flex flex-wrap gap-3 items-start bg-neutral-950">
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/logos/${p.slug}.svg`} alt="" aria-hidden="true" width={12} height={12} />
                          <span className="text-sm font-bold" style={{ color: p.color }}>{p.name}</span>
                        </div>
                        <div className="flex-1 min-w-48">
                          <p className="text-sm text-neutral-300 leading-relaxed">{p.howTo}</p>
                          <a
                            href={p.docs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm inline-flex items-center min-h-11 underline underline-offset-2 transition-colors hover:text-white"
                            style={{ color: p.color }}
                          >
                            {p.name} docs
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </Collapsible>
              </div>
            )}
          </div>
        </section>
      )}

      {step === "error" && !imageUrl && (
        <div className="mt-8 max-w-2xl w-full px-4 space-y-3">
          <div role="alert" className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">{error}</div>
          <button type="button" onClick={reset} className="min-h-11 text-sm text-neutral-300 hover:text-white transition-colors">Start over</button>
        </div>
      )}

      <div className="pb-16" />
    </main>
  );
}

// Primary buttons squash a little while pressed (not when disabled); the colors keep their hover change.
const PRESS = "transition-[color,background-color,border-color,opacity,scale] duration-75 ease-out enabled:active:scale-[0.97]";

const INPUT_CLASS = "w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-neutral-500 focus:border-neutral-500 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 disabled:opacity-50 transition-colors";

const VIDEO_REVEAL_MS = 400;

const HERO_POSTER = "/examples/hero-poster.webp";

const EXAMPLE_CLIPS = [
  "/examples/clip-netflix-v2.mp4",
  "/examples/clip-vhs.mp4",
  "/examples/clip-outrun.mp4",
  "/examples/clip-adultswim.mp4",
];

function VideoMontage() {
  const [active, setActive] = useState(0);
  // The clip that just ended holds its last frame underneath while the next one fades in on top of it.
  const [previous, setPrevious] = useState<number | null>(null);
  // null until known; until then the montage stays on its first frame.
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  // null until the visitor presses pause or play; reduced motion decides before that.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  const bandRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const paused = userPaused ?? reducedMotion ?? true;
  const playing = !paused && onScreen;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // design-ok: pauses the montage while it is scrolled out of view; nothing animates on scroll
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    if (bandRef.current) observer.observe(bandRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const vid = videoRefs.current[active];
    if (!vid) return;
    if (!playing) { vid.pause(); return; }
    // Normally reset when it faded out; with reduced motion there was no fade to end.
    if (vid.ended) vid.currentTime = 0;
    // Muted autoplay can't be refused; a rejection here only means the element went away mid-call.
    vid.play().catch(() => {});
    const nextVid = videoRefs.current[(active + 1) % EXAMPLE_CLIPS.length];
    if (nextVid) nextVid.preload = "auto";
  }, [active, playing]);

  return (
    <>
      <div ref={bandRef} className="absolute inset-0 bg-black" aria-hidden="true">
        {EXAMPLE_CLIPS.map((src, i) => (
          <video
            key={src}
            ref={(el) => { videoRefs.current[i] = el; }}
            src={src}
            poster={i === 0 ? HERO_POSTER : undefined}
            muted
            playsInline
            preload={i === 0 ? "metadata" : "none"}
            onEnded={() => {
              setPrevious(i);
              setActive((i + 1) % EXAMPLE_CLIPS.length);
            }}
            onTransitionEnd={(e) => {
              if (e.target !== e.currentTarget) return;
              if (i === active) { setPrevious(null); return; }
              if (i !== previous) { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }
            }}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: i === active || i === previous ? 1 : 0, zIndex: i === active ? 2 : i === previous ? 1 : 0 }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setUserPaused(!paused)}
        aria-label={paused ? "Play background video" : "Pause background video"}
        className="absolute top-3 right-3 z-20 grid place-items-center w-11 h-11 rounded-lg border border-neutral-700 bg-neutral-950 text-neutral-300 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className={`[grid-area:1/1] transition-opacity duration-150 ${paused ? "opacity-0" : ""}`}>
          <rect x="3" y="2" width="3.5" height="12" /><rect x="9.5" y="2" width="3.5" height="12" />
        </svg>
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className={`[grid-area:1/1] transition-opacity duration-150 ${paused ? "" : "opacity-0"}`}>
          <path d="M4 2l10 6-10 6z" />
        </svg>
      </button>
    </>
  );
}

function makeFilename(name: string, style: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "intro";
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5).replace(":", "");
  return `${slug}-${style}-${date}-${time}.mp4`;
}

// Owns its own interval so the 10 Hz tick re-renders only this text, not the whole page.
function ElapsedSeconds({ since }: { since: number }) {
  const [now, setNow] = useState(since);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);
  return <>{(Math.max(0, now - since) / 1000).toFixed(1)}s</>;
}

function ThemeTile({ label, desc, image, active, color, disabled, eager = false, onClick }: {
  label: string; desc: string; image: string; active: boolean; color: string; disabled: boolean; eager?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col rounded-lg border overflow-hidden transition-colors disabled:opacity-50 text-left bg-neutral-950"
      style={{ borderColor: active ? color : "#262626", borderWidth: active ? 2 : 1 }}
    >
      {/* Caption sits under the image so it never covers the logo in it */}
      <span className="relative block w-full" style={{ aspectRatio: "16/9" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          width={640}
          height={360}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-100 delay-0 group-hover:opacity-100 group-hover:duration-200 group-hover:delay-150 group-focus-visible:opacity-100 group-focus-visible:delay-0 px-2.5 bg-black/80">
          <span className="text-sm text-center leading-snug text-neutral-100">{desc}</span>
        </span>
      </span>
      <span className={`block px-2 py-1.5 text-sm leading-tight ${active ? "font-bold text-white" : "font-medium text-neutral-300"}`}>
        {active && <span aria-hidden="true">✓ </span>}{label}
      </span>
    </button>
  );
}

function ModelOption({ label, cost, desc, note, active, accentColor, disabled, onClick }: {
  label: string; cost: string; desc: string; note?: string; active: boolean; accentColor: string; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start p-2.5 rounded-lg border text-sm transition-colors disabled:opacity-50 text-left"
      style={active
        ? { borderColor: accentColor, backgroundColor: accentColor + "15" }
        : { borderColor: "#262626" }
      }
    >
      <div className="flex items-center justify-between gap-2 w-full mb-0.5">
        <span className={`min-w-0 ${active ? "font-bold" : "font-semibold"}`} style={active ? { color: accentColor } : { color: "#e5e7eb" }}>
          {active && <span aria-hidden="true">✓ </span>}{label}
        </span>
        <span className="text-neutral-400 text-xs whitespace-nowrap shrink-0">{cost}</span>
      </div>
      <span className="text-neutral-400 leading-tight">{desc}</span>
      {note && <span className="mt-1.5 text-xs font-medium" style={{ color: accentColor }}>{note}</span>}
    </button>
  );
}

function StepIndicator({ label, status, color }: { label: string; status: "pending" | "active" | "done" | "error"; color: string }) {
  const circleRef = useRef<HTMLDivElement>(null);
  const previousStatusRef = useRef(status);
  // Pulse once when a step finishes while you watch; a step that was already done when it appeared stays still.
  useEffect(() => {
    if (status === "done" && previousStatusRef.current !== "done") pulseOnce(circleRef.current);
    previousStatusRef.current = status;
  }, [status]);
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        ref={circleRef}
        aria-hidden="true"
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
        style={
          status === "done"   ? { background: color, color: "#000" } :
          status === "active" ? { background: "#fff", color: "#000" } :
          status === "error"  ? { background: "#7f1d1d", color: "#fca5a5" } :
                                { background: "#262626", color: "#a3a3a3" }
        }
      >
        {status === "done" ? "✓" : status === "active" ? "…" : status === "error" ? "✕" : "○"}
      </div>
      <span
        className={`text-sm ${status === "pending" ? "text-neutral-400" : ""}`}
        style={
          status === "active" ? { color: "#fff" } :
          status === "done"   ? { color } :
          status === "error"  ? { color: "#fca5a5" } :
                                undefined
        }
      >
        {label}
      </span>
    </div>
  );
}

function EditablePromptBlock({
  label, meta, generated, override, onChange,
}: {
  label: string;
  meta: string;
  generated: string;
  override: string | null;
  onChange: (v: string | null) => void;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const labelId = useId();
  const active = override ?? generated;
  const isEdited = override !== null && override !== generated;

  // field-sizing: content grows the textarea in CSS; measure by hand only where it's unsupported.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || CSS.supports("field-sizing", "content")) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [active]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(active);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2500);
  }

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: isEdited ? "#3f3f00" : "#262626" }}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 px-3 border-b" style={{ backgroundColor: isEdited ? "#1a1a00" : "#171717", borderColor: isEdited ? "#3f3f00" : "#262626" }}>
        <div className="flex flex-wrap items-center gap-x-2 py-1.5">
          <span id={labelId} className="text-sm text-neutral-200">{label}</span>
          <span className="text-sm text-neutral-400">{meta}</span>
          {isEdited
            ? <span className="text-sm" style={{ color: "#facc15" }}>Edited</span>
            : <span className="text-sm text-neutral-400">Click to edit</span>
          }
        </div>
        <div className="flex items-center gap-1">
          {isEdited && (
            <button type="button" onClick={() => onChange(null)} className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors">
              Reset
            </button>
          )}
          <button type="button" onClick={copy} className="grid min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors">
            <span className={`[grid-area:1/1] transition-opacity duration-150 ${copyState === "copied" ? "opacity-0" : ""}`}>Copy</span>
            <span aria-hidden="true" className={`[grid-area:1/1] transition-opacity duration-150 ${copyState === "copied" ? "" : "opacity-0"}`}>Copied</span>
          </button>
          <span role="status" className={copyState === "failed" ? "text-sm text-red-400" : "sr-only"}>
            {copyState === "copied" ? "Prompt copied" : copyState === "failed" ? "Couldn’t copy; select the text and copy it by hand" : ""}
          </span>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        aria-labelledby={labelId}
        value={active}
        onChange={e => onChange(e.target.value === generated ? null : e.target.value)}
        className="block w-full px-3 py-2.5 text-base sm:text-xs font-mono leading-relaxed bg-neutral-950 text-neutral-300 resize-none [field-sizing:content] focus-visible:outline-2 focus-visible:outline-white focus-visible:-outline-offset-2 focus:text-neutral-100 hover:bg-neutral-900 transition-colors cursor-text"
        style={{ overflow: "hidden", minHeight: "4rem" }}
        spellCheck={false}
      />
    </div>
  );
}
