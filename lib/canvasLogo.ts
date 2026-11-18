import type { Style } from "./runway";

/** Draws the title card for a canvas style (see CANVAS_STYLES) in the browser: a 1280×720 JPEG data URI, no Runway credits. */
export async function renderCanvasLogo(style: Style, name: string, tagline: string): Promise<string> {
  const W = 1280, H = 720;
  const cvs = document.createElement("canvas");
  cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext("2d")!;

  const displayName = name.trim().toUpperCase();
  const hasTagline = Boolean(tagline.trim());

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
      ctx.fillText(tagline.trim().toLowerCase(), W / 2, H * 0.59);
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
      ctx.fillText(tagline.trim().toUpperCase(), W / 2, H * 0.62);
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
      ctx.fillText(tagline.trim().toUpperCase(), W / 2, H * 0.62);
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
      ctx.fillText(tagline.trim().toUpperCase(), W / 2, labelY + labelH + 6 + (tagFontSize + 12) / 2);
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
      ctx.fillText(tagline.trim().toUpperCase(), textX - skewOffsetX, textY - skewOffsetY + fontSize * 0.78);
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
    const studioConfigs: Record<"dreamworks" | "tristar" | "hannabarbera" | "columbia", { font: (sz: number) => string; color: string; shadowColor: string; textY: number; clearY: number; clearH: number }> = {
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
      ctx.fillText(tagline.trim(), W / 2, tagY);
    }
  }

  return cvs.toDataURL("image/jpeg", 0.95);
}
