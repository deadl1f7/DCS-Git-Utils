#!/usr/bin/env node

import process from "node:process";
import { promises as fs, existsSync } from "node:fs";
import path from "node:path"
import { startWatchers } from "./watchers";
import { handleArchive, unpackMiz } from "./compression";
import { sortFiles } from "./sorting";
import { initializeConfig } from "./config";

const [_0, _1, file] = process.argv;

const backupMiz = async (filepath: string) => {

    if (!filepath?.indexOf(".miz")) {
        throw new Error('no miz file ext');
    }

    const fileWithoutExt = filepath.replace(path.extname(filepath), "");
    await fs.copyFile(filepath, `${fileWithoutExt}_backup_${new Date().toISOString().replace(/:/g, '-')}.miz`);
}

const initialize = async () => {

    const { missionPath, outDir, } = await initializeConfig({ file });

    backupMiz(missionPath);

    if (existsSync(outDir)) {
        console.log('out exists, using this as source');
        await handleArchive(outDir, missionPath);
    } else {
        console.log("Initial unpack of .miz");
        const files = await unpackMiz(missionPath, outDir);
        const filePaths = files.filter(f => f.type === "file").map(f => path.join(outDir, f.path));
        await sortFiles(filePaths);
    }

    return { mizPath: missionPath, outDir };
}


(async () => {

    const { mizPath, outDir } = await initialize();

    startWatchers(mizPath, outDir);
})()

