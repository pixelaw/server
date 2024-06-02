import * as fs from 'fs';
import { PNG } from 'pngjs';

function generateTiles(filename: string, tileSize: number, scaleFactor: number): void {
    fs.createReadStream(filename)
        .pipe(new PNG())
        .on('parsed', function () {
            for (let y = 0; y < this.height; y += tileSize) {
                for (let x = 0; x < this.width; x += tileSize) {
                    const tile = new PNG({ width: tileSize, height: tileSize });

                    const width = this.width >= x+tileSize?tileSize:this.width - x
                    const height = this.height >= y+tileSize?tileSize:this.height - y

                    this.bitblt(tile, x, y, width, height, 0, 0);

                    tile.pack().pipe(fs.createWriteStream(`tiles/${scaleFactor}_${tileSize}_${x}_${y}.png`));
                }
            }
        });
}

const filename = process.argv[2];
const tileSize = parseInt(process.argv[3]);
const scaleFactor = parseInt(process.argv[4]);

if (!filename || !tileSize) {
    console.log('Usage: node script.js <filename> <tileSize>');
    process.exit(1);
}

generateTiles(filename, tileSize, scaleFactor);
