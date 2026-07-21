import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");

const svg = readFileSync(join(iconsDir, "icon.svg"));
const sizes = [192, 512];
for (const size of sizes) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(join(iconsDir, `icon-${size}.png`));
  console.log(`wrote icon-${size}.png`);
}

const maskableSvg = readFileSync(join(iconsDir, "icon-maskable.svg"));
await sharp(maskableSvg, { density: 384 })
  .resize(512, 512)
  .png()
  .toFile(join(iconsDir, "icon-maskable-512.png"));
console.log("wrote icon-maskable-512.png");
