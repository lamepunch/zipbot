import { REACTIONS } from "../constants.js";

import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const dir = path.join(process.cwd(), "media", "reactions", "unzips");

  for (let i = 0; i < REACTIONS.length; i++) {
    const url = REACTIONS[i];
    const originalFilename = path.basename(new URL(url).pathname);
    const extension = path.extname(originalFilename);
    const filename = `${i + 1}${extension}`;
    const filepath = path.join(dir, filename);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Encountered ${response.status} when trying to fetch image`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await fs.writeFile(filepath, buffer);

      console.log(`Saved ${filename}`);
    } catch (error) {
      console.error(`Failed to download ${filename}:`, error);
    }
  }
}

main();
