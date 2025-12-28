import fg from 'fast-glob';
import fs from 'fs';
import slash from 'slash';

export const latestModifiedMsFromDir = async (dir: string) => {
    const dirPath = slash(dir);
    const files = await fg(`${dirPath}/**/*`, {
        dot: false,
        onlyFiles: true,
    });

    if (files.length === 0) return 0;

    const mtimes = files.map(file => fs.statSync(file).mtimeMs);

    const latestTimestamp = Math.max(...mtimes);

    return latestTimestamp;
}