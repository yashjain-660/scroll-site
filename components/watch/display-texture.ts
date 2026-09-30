import * as THREE from "three";

/**
 * The watch face is a canvas texture rather than an image so it can be redrawn
 * as the scroll moves between watch-face states, and so it stays crisp at the
 * close-up camera position where an image would show its pixels.
 */

export type FaceMode =
  | "time"
  | "activity"
  | "workout"
  | "dive"
  | "ecg"
  | "night"
  | "compass";

const W = 512;
const H = 620;

const FG = "#f5f5f4";
const DIM = "rgba(245,245,244,0.45)";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** One activity ring: a dim full circle with a bright arc over it. */
function ring(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  width: number,
  amount: number,
  color: string,
) {
  ctx.lineWidth = width;
  ctx.lineCap = "round";

  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * amount);
  ctx.stroke();
}

function drawTime(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = DIM;
  ctx.font = "500 30px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("TUE 30 SEP", 44, 96);

  ctx.fillStyle = "#7de08a";
  ctx.textAlign = "right";
  ctx.fillText("98%", W - 44, 96);

  ctx.fillStyle = FG;
  ctx.textAlign = "center";
  ctx.font = "300 172px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("10:09", W / 2, 336);

  ring(ctx, 128, 470, 52, 15, 0.82, "#ff4d5e");
  ring(ctx, 256, 470, 52, 15, 0.64, "#a8ff3e");
  ring(ctx, 384, 470, 52, 15, 0.41, "#3ed8ff");

  ctx.fillStyle = DIM;
  ctx.font = "500 26px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("thewebvale", W / 2, 578);
}

function drawActivity(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = DIM;
  ctx.font = "500 30px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ACTIVITY", W / 2, 88);

  ring(ctx, W / 2, 268, 138, 34, 0.82, "#ff4d5e");
  ring(ctx, W / 2, 268, 98, 34, 0.64, "#a8ff3e");
  ring(ctx, W / 2, 268, 58, 34, 0.41, "#3ed8ff");

  const rows: [string, string, string][] = [
    ["MOVE", "512/620 CAL", "#ff4d5e"],
    ["EXERCISE", "38/60 MIN", "#a8ff3e"],
    ["STAND", "9/12 HR", "#3ed8ff"],
  ];
  ctx.textAlign = "left";
  rows.forEach(([label, value, color], i) => {
    const y = 456 + i * 54;
    ctx.fillStyle = color;
    ctx.font = "600 26px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(label, 52, y);
    ctx.fillStyle = FG;
    ctx.textAlign = "right";
    ctx.font = "400 26px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(value, W - 52, y);
    ctx.textAlign = "left";
  });
}

function drawWorkout(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#a8ff3e";
  ctx.font = "600 28px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("OUTDOOR RUN", W / 2, 92);

  ctx.fillStyle = FG;
  ctx.font = "300 130px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("42:18", W / 2, 258);

  ctx.fillStyle = DIM;
  ctx.font = "500 26px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("ELAPSED", W / 2, 300);

  // heart-rate trace
  ctx.strokeStyle = "#ff4d5e";
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const x = 52 + (i / 60) * (W - 104);
    const wave =
      Math.sin(i * 0.55) * 22 + Math.sin(i * 0.17) * 14 + Math.sin(i * 1.3) * 6;
    const y = 396 + wave;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const stats: [string, string][] = [
    ["168", "BPM"],
    ["5'02\"", "PACE"],
    ["8.4", "KM"],
  ];
  stats.forEach(([value, label], i) => {
    const x = 96 + i * 160;
    ctx.fillStyle = FG;
    ctx.textAlign = "center";
    ctx.font = "400 46px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(value, x, 508);
    ctx.fillStyle = DIM;
    ctx.font = "500 22px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(label, x, 546);
  });
}

function drawDive(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#00e5ff";
  ctx.font = "600 24px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("EN 13319 · DIVE COMPUTER", W / 2, 78);

  // Big Depth display
  ctx.fillStyle = FG;
  ctx.font = "300 144px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("34.2", W / 2 - 20, 230);
  ctx.font = "600 36px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#00e5ff";
  ctx.fillText("M", W / 2 + 150, 230);

  ctx.fillStyle = DIM;
  ctx.font = "500 22px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CURRENT DEPTH", W / 2, 272);

  // Depth meter bar: horizontal segmented bar
  const barY = 312;
  const barW = W - 88;
  const barH = 12;
  const barX = 44;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(ctx, barX, barY, barW, barH, 6);
  ctx.fill();

  const filledW = (barW * 34.2) / 100;
  const grad = ctx.createLinearGradient(barX, 0, barX + filledW, 0);
  grad.addColorStop(0, "#00e5ff");
  grad.addColorStop(1, "#3b82f6");
  ctx.fillStyle = grad;
  roundRect(ctx, barX, barY, filledW, barH, 6);
  ctx.fill();

  // Metrics: Max depth, Water temp, Dive time
  const metrics: [string, string][] = [
    ["42.0 M", "MAX DEPTH"],
    ["19.4°C", "WATER TEMP"],
    ["28:14", "DIVE TIME"],
  ];
  metrics.forEach(([value, label], i) => {
    const x = 92 + i * 164;
    ctx.fillStyle = FG;
    ctx.textAlign = "center";
    ctx.font = "500 36px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(value, x, 430);
    ctx.fillStyle = DIM;
    ctx.font = "500 20px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(label, x, 464);
  });

  // Ascent rate safety banner
  ctx.fillStyle = "rgba(0, 229, 255, 0.12)";
  roundRect(ctx, 44, 508, W - 88, 56, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 44, 508, W - 88, 56, 12);
  ctx.stroke();

  ctx.fillStyle = "#00e5ff";
  ctx.font = "600 22px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("● SAFE ASCENT RATE · 8 M/MIN", W / 2, 544);
}

function drawEcg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#10b981";
  ctx.font = "600 24px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("OPTICAL PPG · ECG TRACE", W / 2, 78);

  // Large BPM
  ctx.fillStyle = FG;
  ctx.font = "300 136px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("72", W / 2 - 35, 224);
  ctx.font = "600 34px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#f43f5e";
  ctx.fillText("BPM ♥", W / 2 + 105, 224);

  // Medical ECG waveform trace
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.shadowColor = "#10b981";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  const baseline = 330;
  const points = [
    [40, 0], [90, 0], [110, -6], [120, 4], [130, 0], [150, 0],
    [165, -8], [175, 48], [190, -96], [205, 24], [215, -4], [230, 0],
    [260, -18], [285, 0], [330, 0],
    [345, -8], [355, 48], [370, -96], [385, 24], [395, -4], [410, 0],
    [435, -18], [460, 0], [480, 0]
  ];
  points.forEach(([x, yOffset], idx) => {
    if (idx === 0) ctx.moveTo(x, baseline + yOffset);
    else ctx.lineTo(x, baseline + yOffset);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Stats: SpO2, HRV, Skin Temp
  const vitals: [string, string][] = [
    ["99%", "SpO₂ OXYGEN"],
    ["68 MS", "HRV INDEX"],
    ["36.6°", "SKIN TEMP"],
  ];
  vitals.forEach(([value, label], i) => {
    const x = 92 + i * 164;
    ctx.fillStyle = FG;
    ctx.textAlign = "center";
    ctx.font = "500 36px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(value, x, 440);
    ctx.fillStyle = DIM;
    ctx.font = "500 20px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(label, x, 474);
  });

  // Sinus rhythm status pill
  ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
  roundRect(ctx, 50, 516, W - 100, 52, 10);
  ctx.fill();
  ctx.fillStyle = "#10b981";
  ctx.font = "600 20px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("● SINUS RHYTHM · NO SIGNS OF AFIB", W / 2, 549);
}

function drawNight(ctx: CanvasRenderingContext2D) {
  const RED = "#ff263c";
  const RED_DIM = "rgba(255,38,60,0.45)";

  ctx.fillStyle = RED_DIM;
  ctx.font = "600 24px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TACTICAL RED-SHIFT · NIGHT VISION", W / 2, 78);

  ctx.fillStyle = RED;
  ctx.font = "300 156px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("02:44", W / 2, 236);

  ctx.fillStyle = RED_DIM;
  ctx.font = "500 24px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("342° NNW · 2,450M ASL", W / 2, 282);

  // Night compass reticle ring
  ctx.strokeStyle = "rgba(255, 38, 60, 0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(W / 2, 388, 72, 0, Math.PI * 2);
  ctx.stroke();

  // Cardinal pointers
  ctx.fillStyle = RED;
  ctx.font = "700 20px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("N", W / 2, 332);
  ctx.fillStyle = RED_DIM;
  ctx.fillText("S", W / 2, 452);
  ctx.fillText("W", W / 2 - 60, 394);
  ctx.fillText("E", W / 2 + 60, 394);

  // Coordinates & Expedition battery
  const items: [string, string][] = [
    ["12°58'23\"N", "LATITUDE"],
    ["77°35'45\"E", "LONGITUDE"],
    ["18 DAYS", "BATTERY"],
  ];
  items.forEach(([val, label], i) => {
    const x = 90 + i * 166;
    ctx.fillStyle = RED;
    ctx.textAlign = "center";
    ctx.font = "600 26px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(val, x, 516);
    ctx.fillStyle = RED_DIM;
    ctx.font = "500 18px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(label, x, 546);
  });
}

function drawCompass(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#f59e0b";
  ctx.font = "600 24px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DUAL-BAND GNSS (L1 + L5)", W / 2, 78);

  // Big Azimuth display
  ctx.fillStyle = FG;
  ctx.font = "300 132px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("048°", W / 2 - 25, 220);
  ctx.fillStyle = "#f59e0b";
  ctx.font = "600 36px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("NE", W / 2 + 130, 220);

  // Circular Compass Rose with ticks
  const cx = W / 2;
  const cy = 356;
  const radius = 95;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw 12 radial ticks
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const isMajor = i % 3 === 0;
    const innerR = isMajor ? radius - 16 : radius - 8;
    const x1 = cx + Math.sin(angle) * innerR;
    const y1 = cy - Math.cos(angle) * innerR;
    const x2 = cx + Math.sin(angle) * radius;
    const y2 = cy - Math.cos(angle) * radius;

    ctx.strokeStyle = isMajor ? "#f59e0b" : "rgba(255,255,255,0.3)";
    ctx.lineWidth = isMajor ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Heading indicator arrow
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 30);
  ctx.lineTo(cx - 10, cy + 18);
  ctx.lineTo(cx + 10, cy + 18);
  ctx.closePath();
  ctx.fill();

  // Metrics: Elevation, Waypoint, Incline
  const waypoints: [string, string][] = [
    ["2,180M", "ELEVATION"],
    ["BASE 4.2K", "WAYPOINT"],
    ["±0.4M", "GNSS LOCK"],
  ];
  waypoints.forEach(([val, label], i) => {
    const x = 90 + i * 166;
    ctx.fillStyle = FG;
    ctx.textAlign = "center";
    ctx.font = "600 28px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(val, x, 498);
    ctx.fillStyle = DIM;
    ctx.font = "500 20px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(label, x, 532);
  });

  ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
  roundRect(ctx, 50, 560, W - 100, 42, 8);
  ctx.fill();
  ctx.fillStyle = "#f59e0b";
  ctx.font = "600 18px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("● BACKTRACK ACTIVE · 28 WAYPOINTS LOGGED", W / 2, 587);
}

/**
 * Draws one face state. The panel geometry is a plain rectangle, so the rounded
 * corners are painted here — the case sits over the edge and hides the seam.
 */
export function drawFace(canvas: HTMLCanvasElement, mode: FaceMode) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  roundRect(ctx, 6, 6, W - 12, H - 12, 96);
  ctx.clip();

  // faint top-down sheen so the panel does not read as flat black
  const sheen = ctx.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0, "rgba(255,255,255,0.055)");
  sheen.addColorStop(0.45, "rgba(255,255,255,0.012)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  if (mode === "time") drawTime(ctx);
  else if (mode === "activity") drawActivity(ctx);
  else if (mode === "workout") drawWorkout(ctx);
  else if (mode === "dive") drawDive(ctx);
  else if (mode === "ecg") drawEcg(ctx);
  else if (mode === "night") drawNight(ctx);
  else if (mode === "compass") drawCompass(ctx);

  ctx.restore();
}

export function createFaceTexture(mode: FaceMode = "time") {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  drawFace(canvas, mode);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return { canvas, texture };
}
