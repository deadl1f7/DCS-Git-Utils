import * as _ from "lodash"
import * as chokidar from 'chokidar';
import { sortFiles } from "./sorting";
import { handleArchive, unpackMiz } from "./compression";
import path from "node:path";
import { debounce } from "lodash";

let locked = false;

const unlock = debounce(() => {
    locked = false;
}, 3000);

export const startWatchers = (mizPath: string, outDir: string) => {


    chokidar.watch(mizPath, { awaitWriteFinish: true, ignoreInitial: true }).on("change", async () => {

        if (locked) {
            return;
        }

        console.log("miz changed");

        locked = true;
        unlock.cancel();
        const files = await unpackMiz(mizPath, outDir)
        const filePaths = files.map(f => path.join(outDir, f.path));
        await sortFiles(filePaths);
        await handleArchive(outDir, mizPath);
        unlock();
    })

    const outChange = async () => {

        if (locked) {
            unlock();
            return;
        }

        console.log("out changed");

        locked = true;
        unlock.cancel();
        await handleArchive(outDir, mizPath);
        unlock();
    }

    chokidar.watch(outDir, { ignoreInitial: true })
        .on("add", async () => {
            await outChange();
        }).on("addDir", async () => {
            await outChange();
        }).on("change", async () => {
            await outChange();
        })

}