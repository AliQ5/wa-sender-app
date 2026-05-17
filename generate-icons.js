const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const png2icons = require('png2icons');

const svgCode = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect x="32" y="32" width="448" height="448" rx="112" fill="#25D366" />
  <path d="M256,134.4 C185.456,134.4 128.256,191.6 128.256,262.144 C128.256,290.304 137.408,316.48 152.64,338.496 L136.224,386.496 L185.44,370.432 C206.56,384.448 231.68,392.448 256,392.448 C326.544,392.448 383.744,335.248 383.744,264.704 C383.744,194.16 326.544,134.4 256,134.4 Z" fill="#FFFFFF" />
  <path d="M211.584,204.64 C208.576,197.888 205.408,197.76 202.56,197.632 C200.256,197.504 197.568,197.504 194.88,197.504 C192.192,197.504 187.84,198.528 184.16,202.496 C180.48,206.464 170.112,216.128 170.112,235.84 C170.112,255.552 184.48,274.624 186.496,277.312 C188.512,280 214.336,321.408 255.04,337.536 C288.896,350.976 295.808,348.288 303.168,347.264 C310.528,346.24 326.912,337.536 330.24,328.192 C333.568,318.848 333.568,310.848 332.544,309.184 C331.52,307.52 328.832,306.528 324.8,304.512 C320.768,302.496 301.056,292.8 297.376,291.456 C293.696,290.112 291.008,289.44 288.32,293.44 C285.632,297.44 278.08,306.528 275.712,309.184 C273.344,311.84 270.976,312.16 266.944,310.144 C262.912,308.128 249.92,303.872 234.56,290.176 C222.656,279.552 214.592,266.304 212.24,262.272 C209.888,258.24 211.968,256.064 214.016,254.08 C215.808,252.336 218.048,249.44 220.064,247.168 C222.08,244.896 222.752,243.2 224.064,240.512 C225.408,237.824 224.736,235.488 223.712,233.472 C222.704,231.456 214.592,211.392 211.584,204.64 Z" fill="#25D366" />
</svg>
`;

async function buildIcons() {
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  const pngPath = path.join(assetsDir, 'icon.png');
  const icoPath = path.join(assetsDir, 'icon.ico');
  const icnsPath = path.join(assetsDir, 'icon.icns');

  await sharp(Buffer.from(svgCode))
    .png()
    .toFile(pngPath);

  console.log('Created icon.png');

  const pngBuffer = fs.readFileSync(pngPath);

  const icoBuffer = png2icons.createICO(pngBuffer, png2icons.BILINEAR, 0, false, true);
  if (icoBuffer) {
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('Created icon.ico');
  }

  const icnsBuffer = png2icons.createICNS(pngBuffer, png2icons.BILINEAR, 0);
  if (icnsBuffer) {
    fs.writeFileSync(icnsPath, icnsBuffer);
    console.log('Created icon.icns');
  }
}

buildIcons().catch(console.error);
