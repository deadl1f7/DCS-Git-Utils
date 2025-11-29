import path from "node:path"
import * as fs from 'fs';
import { pickMissionFileNative } from "./file-picker"

export const getMizPath = async (root: string = ".") => {
    const mizPath = await pickMissionFileNative();

    const dir = mizPath.replace(path.basename(mizPath), "");
    return { mizPath, dir };
}