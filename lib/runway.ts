import RunwayML from "@runwayml/sdk";

function getClient(apiKey: string) {
  return new RunwayML({ apiKey, timeout: 120_000 });
}

export type Style =
  | "cinematic"
  | "retro"
  | "futuristic"
  | "minimal"
  | "horror"
  | "anime"
  | "epic"
  | "nature"
  | "prestige"
  | "adultswim"
  | "cartoon"
  | "vhs"
  | "grindhouse"
  | "lofi"
  | "vaporwave"
  | "cyberpunk"
  | "hbo"
  | "blockbuster"
  | "dreamworks"
  | "tristar"
  | "hannabarbera"
  | "columbia"
  | "mst3k"
  | "ebs";

export type Duration = 2 | 4 | 5 | 6 | 8 | 10;
export type VideoModel = "gen4_turbo" | "gen4.5" | "gen3a_turbo" | "veo3" | "veo3.1" | "veo3.1_fast";
export type ImageModel = "gen4_image" | "gen4_image_turbo" | "gpt_image_2" | "gemini_image3_pro" | "gemini_2.5_flash";
export type Treatment = "full-bleed" | "theatrical" | "minimal";

export function imageRatio(model: ImageModel): string {
  if (model === "gpt_image_2") return "1920:1088";
  if (model === "gemini_image3_pro" || model === "gemini_2.5_flash") return "1344:768";
  return "1920:1080";
}

const styleDescriptions: Record<Style, string> = {
  cinematic:
    "deep navy and gold color palette, dramatic god rays, film grain, epic atmosphere, dark background",
  retro:
    "80s neon synthwave aesthetic, hot pink and electric blue, CRT glow, retro grid, dark background",
  futuristic:
    "holographic chrome, electric cyan and white, sci-fi glitch effects, lens flare, space black background",
  minimal:
    "clean white sans-serif typography, soft gradient background, understated elegant design",
  horror:
    "blood red and pitch black, gothic serif font, creeping fog, dark shadows, candle-lit atmosphere",
  anime:
    "bold shonen anime title card, explosive energy burst behind letterforms, thick black ink outlines on the logo text, speed lines radiating outward from center, dramatic aura glow — electric blue outer rim, white-hot inner core, deep black background, saturated vivid orange and blue power colors, dynamic manga composition",
  adultswim:
    "Adult Swim network bumper, absolute pure black (#000000) background with zero texture or gradient, single block of clean white Helvetica Neue Condensed Bold text centered in frame — 2 to 3 lines of lowercase deadpan text in the service name, small lowercase brand mark in square brackets '[service name]' in the lower-right corner subordinate to the main text, white (#FFFFFF) on pure black only — no colors, no borders, no decoration of any kind, clinical broadcast television identity",
  cartoon:
    "classic Cartoon Network checkerboard logo — 'CARTOON' stacked above 'NETWORK' in Eagle Bold slab-influenced sans-serif, each letter set inside alternating black and white checkerboard tiles forming a perfect square grid, white letters on black tiles and black letters on white tiles, flat fill with zero gradients, surrounding environment in maximum-saturation flat primary colors — fire engine red, cobalt blue, canary yellow, grass green — classic 1990s television network graphic identity, bold and punchy",
  vhs:
    "90s VHS home video aesthetic, washed-out faded colors, magnetic tape tracking error artifacts — horizontal glitch bands across the image, analog scan lines visible, timestamp counter in corner, muted desaturated palette with color bleeding at edges, soft focus and analog warmth, recorded-over-many-times tape degradation quality",
  grindhouse:
    "1968 National Screen Service psychedelic feature presentation bumper, frame entirely filled with pulsing kaleidoscopic concentric rings radiating outward from center — maximum saturation of ALL colors simultaneously: electric red, acid orange, lime green, cobalt blue, hot magenta, gold-yellow — rings animate outward continuously, glowing central orb in warm amber-pink, bold all-caps condensed gothic sans-serif logo typography in white or yellow at center, heavy film grain over entire frame, the text reads as if cut from cardstock with hard edges",
  lofi:
    "lo-fi hip hop study beats anime aesthetic, cozy warm interior, rain streaking slowly down a window in the background, soft warm amber lamp light glowing, vinyl record player or cassette tape in scene, logo text sitting quietly centered, hand-drawn anime illustration style, muted warm amber and soft cool blue palette, ChilledCow lofi girl energy, peaceful and nostalgic",
  vaporwave:
    "vaporwave aesthetic, white marble Hellenistic Apollo bust floating in a digital void, flat magenta (#FF71CE) and cyan (#01CDFE) perspective-grid floor receding to horizon, semi-circle sun with gradient from deep magenta (#F52E97) through violet to indigo, Japanese katakana ＡＥＳＴＨＥＴＩＣ in wide geometric sans-serif, RGB chromatic aberration with prismatic fringing on all edges, VHS scan lines, deep purple background (#300350), soft bloom glow on neon elements, logo in wide-spaced geometric sans-serif",
  cyberpunk:
    "cyberpunk dystopia, dark rain-soaked night city, neon signs in Japanese characters glowing electric red and blue reflected on wet pavement, dense fog and smog between towering megabuildings, mega-city skyline silhouette in background, logo glowing with electric neon light against the darkness, Blade Runner 2049 meets Akira aesthetic, neon rain streaking through smog, moody atmospheric and dangerous",
  hbo:
    "1982 HBO Feature Presentation broadcast opening, massive three-dimensional chrome-plated brass letter forms floating in pure black empty space — physically thick beveled letters with visible metallic sheen, hard specular highlights on every edge, the interior of the letter O contains a spinning disc of fiber optic light rays in electric blue, crimson red, gold and emerald green rotating outward, deep cobalt-black background (#050510) with dense star field of small white stars, high-contrast analog television static texture at the edges, cinematic scope composition, letters float weightlessly in darkness with no ground, no architecture, no buildings, no landscape beneath",
  epic:
    "golden hour light, sweeping dust, monumental scale, bronze and amber tones, cinematic widescreen",
  nature:
    "earthy organic tones, lush green, soft natural light, documentary aesthetic, clean sans-serif",
  prestige:
    "bold crimson red wordmark — vivid saturated red (#E50914) primary faces with dark maroon shadow sides giving the letterforms subtle dimensional depth, clean geometric sans-serif, logo centered with generous negative space on all sides, premium streaming service identity",
  blockbuster:
    "late 1980s video rental store logo aesthetic, bold golden-yellow (#FFDE00) all-caps condensed block lettering on deep navy blue (#00157C), enormous heavy letterforms filling the frame, horizontal yellow accent band behind the text, film strip perforations bordering the top and bottom edges, warm incandescent glow radiating from the letterforms, late 80s corporate retail signage energy, nostalgic and bold",
  dreamworks:   "dreamy sky, boy on crescent moon, clouds, cinematic",
  tristar:      "pegasus in sky, clouds, golden light, cinematic",
  hannabarbera: "rainbow swirl circle, chrome star, black background, retro broadcast",
  columbia:     "columbia figure with torch, clouds and light beams, classical cinematic",
  mst3k:        "Mystery Science Theater 3000, asteroid with letters, silhouetted theater seats, space, starfield",
  ebs:          "SMPTE color bars, emergency broadcast system, test pattern, monospace text",
};

// Motion descriptions use positive phrasing only — no "don't/no/never".
// Structure: logo entrance/animation → environment animates → camera motion → style.
const styleMotion: Record<Style, string> = {
  cinematic:
    "The logo pulses with a slow golden breath — warm light swells across the letterforms, brightening and dimming. Golden light particles drift upward around the glowing text. Atmospheric haze rolls slowly across the dark background. A subtle lens flare blooms from the right edge. Camera pushes slowly forward — slow dolly in. Cinematic, dramatic.",

  retro:
    "The logo flickers on like a neon sign — letterforms light up with intensity variations and electric buzz. A horizontal scanline sweep passes over the frame. Neon edge-glow pulses rhythmically around the letterforms. Electric sparks radiate from the corners of the text. CRT vignette pulses at the edges. Camera holds completely static. 80s synthwave.",

  futuristic:
    "The logo glitches and assembles — chromatic aberration ripples through the letterforms as they snap to clarity with a digital burst. Holographic scan lines sweep over the composition. Bright cyan particles radiate outward from the letterforms and drift away. Camera holds completely static. Sci-fi, sleek.",

  minimal:
    "The logo shimmers softly — a single white light sweep travels left to right across the letterforms, brightening them gently as it passes. The text pulses with a barely perceptible warmth. Gentle shadows at the edges. Camera holds completely static. Clean, minimal, unhurried.",

  horror:
    "The logo flickers and breathes — candleflicker lighting pulses across the letterforms with eerie warmth variations. Deep red smoke curls upward from the base of the frame. A creeping shadow vignette closes slowly inward from all four edges. Camera holds completely static. Gothic, eerie, atmospheric.",

  anime:
    "Speed lines explode outward from center. A white-hot energy burst ignites behind the logo. The letterforms slam into frame — thick-outlined, vibrating with power. An electric aura pulses around the text: deep blue outer glow, white inner core. Energy particles shower downward. Camera holds completely static. Intense, high-energy shonen anime.",

  adultswim:
    "Hard cut to pure black. Two or three lines of white Helvetica Condensed text appear — either all at once or fading in line by line over two seconds. The text holds completely still, deadpan. The small lowercase brand mark in square brackets sits quietly in the lower corner, subordinate and unassuming. A single barely perceptible scan line flickers once across the frame and disappears. Nothing else moves. The stillness is absolute. Camera completely static throughout. The text just sits there.",

  cartoon:
    "Individual checkerboard tiles fly into frame from all directions simultaneously, each snapping into position with a sharp graphic impact. Character heads and body parts briefly peek from individual squares — cartoon ears, eyes, hands — then pull back as tiles settle. The letter tiles flip to reveal 'CARTOON' on top, 'NETWORK' below in Eagle Bold. Maximum saturation color flashes — fire engine red, cobalt blue, canary yellow — burst from the character tiles. The complete CN checkerboard logo locks into place. Bold, flat, zero gradients. Camera completely static throughout.",

  vhs:
    "The logo stutters into view — horizontal tracking error bands sweep across the frame as the letterforms struggle to lock in. Color bleeds laterally from the text. A timestamp blinks in the lower corner. The image rolls and warps with analog instability. Scan lines flicker across the composition. The logo stabilizes briefly, then judders again with magnetic dropout noise. Camera holds completely static. Lo-fi, analog, degraded.",

  grindhouse:
    "Kaleidoscopic concentric rings pulse outward from center — maximum saturation of ALL colors simultaneously: electric red, acid orange, lime green, cobalt blue, hot magenta, gold-yellow — rings radiate outward continuously. The central warm amber-pink orb expands and contracts. The text logo 'snipes' in from the four corners of the frame simultaneously, converging at center with mechanical linear motion and no easing — hard edges, no soft antialiasing. Film grain drifts across the entire frame. The 'Funky Fanfare' visual energy: barely-contained color chaos, brassy and driving. Camera holds completely static. Maximum saturation, maximum intent.",

  lofi:
    "The logo drifts gently into the cozy frame and settles — like it belongs there. Rain trickles slowly down the window behind the scene. Warm amber lamp light pulses softly. Steam curls lazily upward from somewhere off-frame. The logo breathes with the scene, unhurried. A barely perceptible warmth washes gently through the image. Camera holds completely static. Peaceful, cozy, hypnotic.",

  vaporwave:
    "The perspective-grid floor pulses slowly toward the magenta-to-indigo horizon. The white marble Apollo bust rotates imperceptibly in the digital void. The flat circle sun breathes — rising slightly, falling slowly. Full-width Japanese katakana characters drift with subtle VHS tracking displacement. RGB chromatic aberration pulses on all elements: the red channel shifts left, blue shifts right — prismatic fringing on every edge — then snaps back. VHS horizontal scan lines sweep slowly upward across the entire frame at 20% opacity. A brief glitch cut: the image corrupts into horizontal displacement blocks for one frame, then snaps back clean. Camera completely static throughout. Dreamy, surreal, hypnotic.",

  cyberpunk:
    "Neon rain falls through dark smog-thick air — streaks of red and blue neon catching in the fog. The logo materializes glowing with electric neon energy against the dark mega-city backdrop. Distant neon signs flicker and reflect on rain-slicked surfaces below. Fog drifts slowly between towers. The logo pulses with neon light — breathing, dangerous. Camera holds completely static. Dark, atmospheric, dystopian.",

  hbo:
    "Pure analog television static fills the frame — high-contrast black-and-white snow grain, textured and three-dimensional, not flat noise. The static holds for a beat. Then the massive chrome-plated brass 3D letterforms phase in through the noise as if a broadcast signal is locking in — physically thick beveled letters with hard specular highlights on every edge. The static recedes. Inside the letter O, a spinning disc of fiber optic light rays ignites: electric blue, crimson red, gold, emerald green beams rotating outward. Warm amber glow pulses from below suggesting the model city. Camera holds completely static. Prestige, broadcast, definitive.",

  epic:
    "The logo rises into frame from below as if cresting a ridge — letterforms scale up and settle center. A golden sunburst erupts from directly behind the text, warm light intensifies and spreads outward. Dust and debris blast outward from around the text and drift into the foreground. Camera eases into a very slow dolly in. Bronze and amber tones. Cinematic widescreen.",

  nature:
    "The logo drifts softly into center frame, gently swaying as if carried by a breeze, then settles. Golden morning light washes slowly left to right across the letterforms. A few leaf particles drift lazily past the foreground. Soft atmospheric haze drifts in the background. Camera holds completely static. Organic, peaceful, documentary.",

  prestige:
    "The logo snaps into view — letterforms crisp, bold, vivid red with a pulse of light. One explosive visual beat: thin vertical bands of deep crimson and dark maroon burst outward from behind the letterforms simultaneously left and right — ribbons of color shooting to the edges of the frame, filling the full width in under one second. The bands hold for a half-beat, then dissolve away. Logo pulses with a final glow. Camera holds completely static throughout.",

  blockbuster:
    "A warm golden-yellow spotlight ignites at center — bright incandescent light floods outward across the deep navy background. The bold block letters radiate warm yellow glow, letterforms pulsing with a buzzing fluorescent warmth. Film strip perforations along the frame edges rattle lightly with a subtle vibration. That familiar store-opening energy: bright, cheerful, unmistakably late-80s retail. Camera holds completely static. Nostalgic, golden, bold.",

  dreamworks:   "Clouds drift slowly. The crescent moon glows. The camera drifts upward. Dreamy and cinematic.",
  tristar:      "The Pegasus gallops powerfully in mid-air, wings beating, clouds churning. Dynamic and epic.",
  hannabarbera: "The rainbow swirl and chrome star animate in retro broadcast style. Retro cel-animation.",
  columbia:     "Light beams sweep the sky, clouds churn. Classical cinematic logo reveal.",
  mst3k:        "The asteroid slowly rotates in space. Stars twinkle. The silhouetted figures point and gesture. Campy sci-fi.",
  ebs:          "Color bars hold static on screen. A harsh tone pulses. The monospace text flashes urgently.",
};

// Gen4.5 supports timestamp-based sequencing for tighter control over pacing.
const styleMotionGen45: Record<Style, string> = {
  cinematic:
    "[00:00] Logo pulses with a slow golden breath — warm light swells across the letterforms. [00:01] Golden light particles drift upward around the glowing text. Atmospheric haze rolls across the dark background. [00:02] Subtle lens flare blooms from the right edge. Camera begins a slow dolly in. [00:04] Scene settles — logo warm and glowing, camera eases to rest. Cinematic, dramatic.",

  retro:
    "[00:00] Logo flickers on like a neon sign — letterforms light up with intensity variations and electric buzz. [00:01] Horizontal scanline sweep passes over the frame top to bottom. Neon edge-glow pulses rhythmically around the letterforms. [00:02] Electric sparks radiate from the corners of the text. CRT vignette pulses at the edges. [00:04] Scene settles — logo neon-bright and glowing. Camera completely static throughout. 80s synthwave.",

  futuristic:
    "[00:00] Logo glitches and assembles — chromatic aberration ripples through the letterforms as they snap to clarity. [00:01] Holographic scan lines sweep over the composition. Digital glitch burst then settles. [00:02] Cyan particles radiate outward from the letterforms. [00:04] Particles drift away — logo sharp and vivid. Camera completely static throughout. Sci-fi, sleek.",

  minimal:
    "[00:00] Logo shimmers softly — soft white light sweep enters from the left. [00:01] Light travels slowly right — letterforms brighten gently as it passes. [00:03] Light sweep exits frame right. Subtle warmth lingers on the letterforms. [00:05] Scene holds — logo softly illuminated. Camera completely static throughout.",

  horror:
    "[00:00] Logo flickers and breathes — candleflicker lighting pulses across the letterforms with eerie warmth variations. [00:01] Deep red smoke curls upward from the base of the frame. [00:02] Creeping shadow vignette begins closing inward from all four edges. [00:04] Vignette tightens — logo flickers through the darkness. Camera completely static throughout. Gothic, eerie.",

  anime:
    "[00:00] Speed lines explode outward from center — white-hot energy burst ignites behind the logo. [00:01] Letterforms slam into frame, thick-outlined, vibrating with power. Electric aura erupts: deep blue outer glow, white inner core. [00:02] Energy particles shower downward from the text. Power aura pulses intensely. [00:03] Aura settles — logo bold, sharp, glowing with residual energy. [00:04] Scene holds, logo radiating heat. Camera completely static throughout. Intense shonen anime.",

  adultswim:
    "[00:00] Hard cut to pure black. [00:01] White Helvetica Condensed text lines appear — fading in sequentially, line by line, over one second. Small lowercase brand mark in brackets fades into lower corner. [00:02] A single scan line flickers once across the frame and disappears. Everything holds still. [00:03] Absolute stillness. Pure black field. White text. That's all. [00:04] Still there. Deadpan. Camera completely static throughout.",

  cartoon:
    "[00:00] Individual checkerboard tiles fly in from all directions — snapping into position with sharp graphic impacts. [00:01] Character body parts peek from individual squares — cartoon ears, eyes, hands — then pull back as tiles settle. [00:02] Letter tiles flip to reveal 'CARTOON' over 'NETWORK' in Eagle Bold. Maximum saturation color flash — fire engine red, cobalt blue, canary yellow. [00:03] Complete CN checkerboard logo locked into place. Bold, flat, zero gradients. [00:04] Scene holds — iconic. Camera completely static throughout.",

  vhs:
    "[00:00] Tracking error bands sweep horizontally — the image rolls and warps with analog instability. [00:01] Logo letterforms struggle into view through the magnetic noise, color bleeding from the edges. Timestamp blinks in the corner. [00:02] Image stabilizes briefly — logo visible but degraded, scan lines flickering. [00:03] Another tracking glitch sweeps the frame, logo judders. [00:04] Logo holds through the interference. Camera completely static throughout. Lo-fi, analog.",

  grindhouse:
    "[00:00] Kaleidoscopic concentric rings pulse outward from center — maximum saturation of ALL colors simultaneously: electric red, acid orange, lime green, cobalt blue, hot magenta, gold-yellow. [00:01] Central warm amber-pink orb expands. Text logo snipes in from all four corners of the frame simultaneously — mechanical linear motion, zero easing, hard edges, no antialiasing. [00:02] Text converges at center. Orb contracts. Film grain thickens across the entire frame. [00:03] Rings continue radiating outward continuously — all colors breathing and pulsing. [00:04] Logo centered and bold. Orb expands again. Maximum saturation, maximum intent. Camera completely static throughout.",

  lofi:
    "[00:00] Cozy interior. Rain trickles down the window. Warm amber lamp light glows softly. [00:01] Logo drifts gently into frame and settles — quiet, at home. Steam curls lazily upward from off-frame. [00:02] Rain continues. Lamp pulses softly. Logo breathes with the scene. [00:03] A gentle warmth washes across the frame. Everything still and peaceful. [00:04] Logo holds in the quiet. Camera completely static throughout. Cozy, hypnotic.",

  vaporwave:
    "[00:00] Deep purple void (#300350). Flat magenta (#FF71CE) and cyan (#01CDFE) perspective grid pulses forward toward the horizon. Flat semicircle sun sits on the horizon — gradient from deep magenta (#F52E97) through violet to indigo. [00:01] White marble Hellenistic Apollo bust floats into the digital void. Full-width Japanese katakana ＡＥＳＴＨＥＴＩＣ drifts with subtle VHS tracking displacement. [00:02] RGB chromatic aberration pulses across all elements: red channel shifts left, blue channel shifts right — prismatic fringing on every edge, then snaps back. VHS horizontal scan lines sweep upward at low opacity. [00:03] Single-frame glitch cut: image corrupts into horizontal displacement blocks, then snaps back clean. Logo shimmers. [00:04] Grid pulses again. Scene holds — dreamy, surreal, hypnotic. Camera completely static throughout.",

  cyberpunk:
    "[00:00] Dark rain-soaked night. Neon rain falls through fog — streaks of red and blue neon light. Mega-city silhouette looms in background. [00:01] Logo materializes — glowing with electric neon against the darkness. Neon reflections ripple on wet surfaces below. [00:02] Fog drifts slowly between towers. Distant neon signs flicker. Logo pulses with electric energy. [00:03] Rain continues. Smog thickens. Logo breathes — electric and dangerous. [00:04] Scene holds, dark and atmospheric. Camera completely static throughout.",

  hbo:
    "[00:00] Frame fills with pure analog television static — high-contrast black-and-white snow grain, dense and textured, not flat noise. [00:01] Broadcast signal begins locking in: massive chrome-plated brass 3D letterforms phase through the static — physically thick beveled letters with hard specular highlights on every edge emerging from the noise. [00:02] Static fully recedes. Letters resolved — chrome-plated, dimensional, imposing. Inside the letter O, a spinning disc of fiber optic light rays ignites: electric blue, crimson red, gold, emerald green beams rotating outward. [00:03] Fiber optic disc blazes with color. Warm amber-orange glow pulses from below, suggesting a model city. [00:04] Logo holds — chrome letters, fiber optic disc spinning, amber glow below. Camera completely static throughout. Prestige, broadcast, definitive.",

  epic:
    "[00:00] Logo rises into frame from below — letterforms scale up and settle center. [00:01] Golden sunburst erupts from directly behind the text — warm light intensifies and spreads. [00:02] Dust and debris blast outward and drift into the foreground. [00:03] Camera begins a very slow dolly in. [00:05] Scene settles — logo large, powerful, sharp. Bronze and amber tones.",

  nature:
    "[00:00] Logo drifts softly into center frame, gently swaying then settling. [00:01] Golden morning light enters from the left, washes slowly right across the letterforms. [00:02] Leaf particles drift lazily past the foreground. Soft atmospheric haze in the background. [00:04] Light settles — logo warm and grounded. Camera completely static throughout. Organic, peaceful.",

  prestige:
    "[00:00] Logo snaps into view — letterforms crisp, bold, vivid red with a pulse of light. [00:01] Explosive beat: thin vertical bands of deep crimson and dark maroon burst outward from behind the letterforms simultaneously left and right — ribbons of color shoot to the edges of the frame. [00:02] Color bands fill the full width of the frame. [00:03] Bands dissolve away. [00:04] Logo pulses with a final glow, then holds clean and sharp. Camera completely static throughout.",

  blockbuster:
    "[00:00] Deep navy frame. A warm golden-yellow spotlight ignites at center — bright incandescent light floods outward. [00:01] Bold block letters radiate warm yellow glow. Letterforms pulse with buzzing fluorescent warmth. Film strip perforations along frame edges rattle with subtle vibration. [00:02] Yellow glow intensifies then settles. The horizontal accent band behind the text brightens. [00:03] Perforations pulse again with golden light. That familiar store-opening energy fills the frame. [00:04] Scene holds. Camera completely static throughout. Late 80s, nostalgic, golden.",

  dreamworks:   "[00:00] Clouds drift slowly. [00:02] Camera drifts upward through the clouds. [00:04] Crescent moon glows. Dreamy and cinematic.",
  tristar:      "[00:00] Pegasus gallops powerfully in mid-air. [00:02] Wings beat, clouds churn. [00:04] Sunlight pulses. Dynamic and epic.",
  hannabarbera: "[00:00] Rainbow swirl animates on black. [00:02] Chrome star flies along the arc. [00:04] Star settles. Retro broadcast.",
  columbia:     "[00:00] Light beams sweep the sky. [00:02] Clouds churn, torch shines. [00:04] Scene holds. Classical cinematic.",
  mst3k:        "[00:00] Stars twinkle in deep space. [00:02] Asteroid rotates slowly. Silhouetted figures gesture and point. [00:04] Campy, low-fi sci-fi energy.",
  ebs:          "[00:00] Color bars hold on screen. Harsh tone. [00:02] Text flashes urgently on the black bar. [00:04] Static. Alert.",
};

const styleBackground: Record<Style, string> = {
  cinematic:  "Background: deep dark navy, almost black.",
  retro:      "Background: very dark, near-black with subtle grid.",
  futuristic: "Background: space black, pure dark.",
  minimal:    "Background: clean soft white or very light grey.",
  horror:     "Background: pitch black.",
  anime:      "Background: deep black with intense energy core at center.",
  adultswim:  "Background: pure black. Nothing else.",
  cartoon:    "Background: bold black and white checkerboard grid.",
  vhs:        "Background: washed-out faded gray-blue, analog static at the edges.",
  grindhouse: "",
  lofi:       "Background: cozy warm amber interior, rain streaking softly down a window.",
  vaporwave:  "",
  cyberpunk:  "Background: dark rainy dystopian night, neon-lit smog and fog, mega-city silhouette.",
  hbo:        "",
  epic:        "Background: dark warm amber-black.",
  nature:      "Background: deep dark natural green-black.",
  prestige:    "",
  blockbuster:  "Background: deep navy blue (#00157C).",
  dreamworks:   "Background: sky blue with clouds.",
  tristar:      "Background: golden sky, clouds, water below.",
  hannabarbera: "Background: pure black.",
  columbia:     "Background: warm sky, clouds, light beams.",
  mst3k:        "Background: dark purple-blue space, starfield, theater seat silhouettes.",
  ebs:          "Background: SMPTE color bars.",
};

const treatmentImage: Record<Treatment, string> = {
  "full-bleed": "logo fills the entire frame edge to edge, bold full-bleed composition, dominant typography",
  "theatrical": "cinematic widescreen with black letterbox bars, movie poster composition, 2.39:1 aspect feel",
  "minimal":    "minimalist design, small refined logo centered on vast dark negative space, sparse and elegant",
};

const treatmentMotion: Record<Treatment, string> = {
  "full-bleed": "Logo fills the frame with bold presence.",
  "theatrical": "Black letterbox bars frame the composition. Cinematic widescreen energy.",
  "minimal":    "Logo surfaces quietly from deep darkness, restrained and elegant.",
};

export interface GenerationParams {
  name: string;
  style: Style;
  tagline?: string;
  duration: Duration;
  imageModel?: ImageModel;
  videoModel?: VideoModel;
  treatment?: Treatment;
  primaryColor?: string;
  customNotes?: string;
  audio?: boolean;
}

export interface PromptPreview {
  imagePrompt: string;
  videoPrompt: string;
}

export function buildPrompts(params: GenerationParams): PromptPreview {
  const { name, style, tagline, treatment = "full-bleed", primaryColor, customNotes, videoModel } = params;
  const upper = name.toUpperCase();
  const taglinePart = tagline?.trim()
    ? `, subtitle text "${tagline.trim().toUpperCase()}" below`
    : "";
  const colorPart = primaryColor ? `, key accent color: ${primaryColor}` : "";
  const notesPart = customNotes?.trim() ? `. ${customNotes.trim()}` : "";

  const bg = styleBackground[style] ? `${styleBackground[style]} ` : "";

  // Adult Swim: name must appear in lowercase brackets, no tagline shouting, no treatment/color overrides
  let imagePrompt: string;
  if (style === "adultswim") {
    const bracketName = `[${name.toLowerCase()}]`;
    const taglineLine = tagline?.trim() ? `, deadpan lowercase second line "${tagline.trim().toLowerCase()}"` : "";
    imagePrompt = `${bg}Adult Swim network ID card: service name "${bracketName}" in white Helvetica Condensed text${taglineLine}, ${styleDescriptions[style]}, professional broadcast design, no people${notesPart}`;
  } else {
    imagePrompt = `${bg}Streaming service logo for "${upper}"${taglinePart}, ${treatmentImage[treatment]}, bold dramatic typography, ${styleDescriptions[style]}, professional logo design, no people${colorPart}${notesPart}`;
  }

  // Gen4.5 supports timestamp-based sequencing — use the more precise version.
  const isGen45 = videoModel === "gen4.5";
  const motion = isGen45 ? styleMotionGen45[style] : styleMotion[style];

  // Positive-phrasing only — no "don't/no/never" (models ignore or invert negatives).
  // Structure: subject stillness declared first, then background animation, then camera.
  const videoPrompt = `The ${upper} streaming service logo is centered in frame. ${motion} ${treatmentMotion[treatment]} Logo text stays sharp and fully legible throughout. Animation begins immediately.${notesPart}`;

  return { imagePrompt, videoPrompt };
}

export async function generateLogoImage(params: GenerationParams, apiKey: string, imagePromptOverride?: string): Promise<string> {
  const { imagePrompt: generatedPrompt } = buildPrompts(params);
  const imagePrompt = imagePromptOverride ?? generatedPrompt;
  const imageModel = params.imageModel ?? "gen4_image";

  const ratio = imageRatio(imageModel);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createParams: Record<string, any> = imageModel === "gpt_image_2"
    ? { model: "gpt_image_2", promptText: imagePrompt, ratio, background: "opaque" }
    : { model: imageModel,    promptText: imagePrompt, ratio };

  const task = await getClient(apiKey).textToImage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .create(createParams as any)
    .waitForTaskOutput({ timeout: 270_000 });

  if (!task.output?.[0]) throw new Error("Image generation produced no output");
  return task.output[0];
}

export async function generateIntroVideo(
  imageUrl: string,
  params: GenerationParams,
  apiKey: string
): Promise<string> {
  const { videoPrompt } = buildPrompts(params);
  const model = params.videoModel ?? "gen4_turbo";

  const isVeoModel = model === "veo3" || model === "veo3.1" || model === "veo3.1_fast";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createParams: Record<string, any> = {
    model,
    promptImage: imageUrl,
    promptText: videoPrompt,
    ratio: "1280:720",
    duration: params.duration,
  };
  if (isVeoModel && params.audio) createParams.audio = true;

  const task = await getClient(apiKey).imageToVideo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .create(createParams as any)
    .waitForTaskOutput({ timeout: 270_000 });

  if (!task.output?.[0]) throw new Error("Video generation produced no output");
  return task.output[0];
}
