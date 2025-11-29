
import fs, { promises } from "node:fs";
import archiver from "archiver";
import decompress from "decompress";

export async function checkStable(
    filePath: string,
    stableChecks = 10,      // how many *consecutive* stable reads required
    interval = 250         // ms between checks
): Promise<boolean> {

    let lastSize: number | null = null;
    let stableCount = 0;

    while (stableCount < stableChecks) {
        let stat;

        try {
            stat = await promises.stat(filePath);
        } catch {
            // file might not exist yet – reset
            lastSize = null;
            stableCount = 0;
            await new Promise((res) => setTimeout(res, interval));
            continue;
        }

        const size = stat.size;

        if (lastSize !== null && size === lastSize) {
            stableCount++;
        } else {
            stableCount = 0; // reset if changed
        }

        lastSize = size;

        await new Promise((res) => setTimeout(res, interval));
    }

    return true; // stable!
}

export const handleArchive = (dirPath: string, mizpath: string) => {
    return new Promise<void>(async (resolve, reject) => {
        const archive = archiver("zip", { zlib: { level: 9 } });

        const output = fs.createWriteStream(mizpath);

        // Handle events
        output.on('close', function () {
            console.log(`Archive created successfully at ${mizpath}, total bytes: ${archive.pointer()}`);
            resolve();
        });

        archive.on('error', function (err) {
            throw err;
        });

        // Pipe archive data to the file
        archive.pipe(output);

        // Append directory
        archive.directory(dirPath, false); // false = no root folder in zip

        // Finalize the archive
        await archive.finalize();
    });
}

export const unpackMiz = async (path: string, outPath: string) => {
    try {

        console.log('decompressing');

        const result = await decompress(path, outPath);

        if (!result.length) {
            throw new Error('Decompression yielded no results, something is wrong with the .miz');
        }

        return result;

    } catch (err) {
        console.error(err);
        throw err;
    }
}