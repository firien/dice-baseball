import * as fs from 'fs';
import * as path from 'path';
import ttf2woff2 from 'ttf2woff2'
import svg2ttf from 'svg2ttf'

const svgFontPath = path.resolve('./docs/fonts/font.svg');
const ttfFontPath = path.resolve('./docs/fonts/font.ttf');

const ttf = svg2ttf(fs.readFileSync(svgFontPath, 'utf8'), {});
fs.writeFileSync(ttfFontPath, Buffer.from(ttf.buffer));

const ttfData = fs.readFileSync(ttfFontPath);
fs.writeFileSync('./docs/fonts/font.woff2', ttf2woff2(ttfData));