// Generate all PWA icon sizes from the master 1024x1024 icon.
// Run: bunx tsx src/lib/generate-icons.ts

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const MASTER = "/tmp/app_icon_master.png";
const OUT_DIR = path.join(process.cwd(), "public", "icons");

const SIZES = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-256.png", size: 256 },
  { name: "icon-384.png", size: 384 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-192-maskable.png", size: 192, maskable: true },
  { name: "icon-512-maskable.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-16.png", size: 16 },
];

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const master = await fs.readFile(MASTER);

  for (const { name, size, maskable } of SIZES) {
    const outPath = path.join(OUT_DIR, name);
    if (maskable) {
      // For maskable icons, add padding so the safe zone (80% center) is preserved
      const paddedSize = Math.round(size * 1.25);
      const tempPath = path.join(OUT_DIR, `_tmp_${size}.png`);
      await sharp(master)
        .resize(size, size, { fit: "contain", background: { r: 26, g: 77, b: 62, alpha: 1 } })
        .toFile(tempPath);
      await sharp({
        create: {
          width: paddedSize,
          height: paddedSize,
          channels: 4,
          background: { r: 26, g: 77, b: 62, alpha: 1 },
        },
      })
        .composite([{ input: tempPath, gravity: "center" }])
        .resize(size, size, { fit: "cover" })
        .png()
        .toFile(outPath);
      await fs.unlink(tempPath);
    } else {
      await sharp(master).resize(size, size, { fit: "cover" }).png().toFile(outPath);
    }
    console.log(`✓ ${name} (${size}x${size}${maskable ? " maskable" : ""})`);
  }

  // Also generate a favicon.ico (32x32 PNG embedded as .ico — browsers accept PNG .ico)
  await sharp(master).resize(32, 32, { fit: "cover" }).png().toFile(path.join(process.cwd(), "public", "favicon.ico"));
  console.log("✓ favicon.ico");

  console.log("\n✅ All icons generated in public/icons/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
