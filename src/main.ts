#!/usr/bin/env node

import process from "node:process";
import { promises as fs, existsSync, statSync } from "node:fs";
import path from "node:path"
import { startWatchers } from "./watchers";
import { handleArchive, unpackMiz } from "./compression";
import { sortFiles } from "./sorting";
import { initializeConfig } from "./config";
import { latestModifiedMsFromDir } from "./files/modified-date";

const [_0, _1, file, ...args] = process.argv;

const shouldBackup = args.some(arg => arg === "--backup" || arg === "-b");
const noWatch = args.some(arg => arg === "--nowatch" || "-n");
const force = args.find(arg => arg.startsWith("--force") || arg.startsWith("-f"))?.split("=")[1];

const backupMiz = async (filepath: string) => {

    if (!filepath?.indexOf(".miz")) {
        throw new Error('no miz file ext');
    }

    const fileWithoutExt = filepath.replace(path.extname(filepath), "");

    await fs.copyFile(filepath, `${fileWithoutExt}_backup_${new Date().toISOString().replace(/:/g, '-')}.miz`);
}

const isOutDirLatest = async (outDir: string, miz: string) => {

    if (!existsSync(outDir)) {
        console.log(`No outdir at: ${outDir}`);
        return false;
    }

    const latestOutDir = await latestModifiedMsFromDir(outDir);
    const mizModified = statSync(miz).mtimeMs;
    console.log(`outDir latest: ${latestOutDir}, miz modified at: ${mizModified}`);
    return latestOutDir > mizModified;
}

const initialize = async (force?: string) => {

    const { missionPath, outDir, } = await initializeConfig({ file });

    if (shouldBackup) {
        backupMiz(missionPath);
    }

    const outDirIsLatest = await isOutDirLatest(outDir, missionPath)


    if (force === "out") {
        console.log('forcing out as source');
        await handleArchive(outDir, missionPath);
    } else if (force === "miz") {
        console.log("forcing .miz as source");
        const files = await unpackMiz(missionPath, outDir);
        const filePaths = files.filter(f => f.type === "file").map(f => path.join(outDir, f.path));
        await sortFiles(filePaths);
    } else if (outDirIsLatest) {
        console.log('out is latest. out as source');
        await handleArchive(outDir, missionPath);
    } else if (!outDirIsLatest) {
        console.log("miz is latest. .miz as source");
        const files = await unpackMiz(missionPath, outDir);
        const filePaths = files.filter(f => f.type === "file").map(f => path.join(outDir, f.path));
        await sortFiles(filePaths);
    }
    else {
        throw new Error('Shouldnt be possible, either a source is forced or a source is selected by modified date');
    }

    return { mizPath: missionPath, outDir };
}

(async () => {

    const { mizPath, outDir } = await initialize(force);

    if (!noWatch) {
        startWatchers(mizPath, outDir);
    }
})()

