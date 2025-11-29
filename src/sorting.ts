import path from "node:path"
import luaparse from "luaparse"
import promises from "node:fs/promises"
import * as _ from "lodash"
import { fengariSortFile } from "./fengari-wrapper";

const jsonExtensions = ["json", "dtc"];

/**
 * Recursively sorts the keys of an object or elements of an array.
 * This function handles arrays, plain objects, and primitives.
 *
 * @param obj The data structure to sort.
 * @returns A new structure with sorted keys/elements.
 */
function lodashSortKeysDeep(obj: any): any {
    if (_.isArray(obj)) {
        // Handle Arrays: Recursively sort each element
        return obj.map(lodashSortKeysDeep);
    }

    if (!_.isPlainObject(obj)) {
        // Handle Primitives and Non-Plain Objects: Return as is
        return obj;
    }

    // Handle Plain Objects: Get sorted keys and build the new object
    return _.keys(obj)
        .sort() // Sort the keys alphabetically
        .reduce((sortedObj: _.Dictionary<any>, key: string) => {
            // Recursively sort the value for the current key
            sortedObj[key] = lodashSortKeysDeep(obj[key]);
            return sortedObj;
        }, {});
}


const checkCharCount = (old: string, sorted: string) => {
    return old.replace(/\s/g, "").length === sorted.replace(/\s/g, "").length
}

export const jsonSort = async (filepath: string) => {

    const fileString = await promises.readFile(filepath, { encoding: 'utf-8' });

    const useCRLF = fileString.includes("\r\n");
    const EOL = useCRLF ? "\r\n" : "\n";

    const obj = JSON.parse(fileString);
    const sorted = lodashSortKeysDeep(obj);
    const stringified = JSON.stringify(sorted);
    if (!checkCharCount(fileString, stringified)) {
        throw new Error(`mismatching input file char count to sorted`)
    }

    const resultString = stringified.replace(/\r?\n/g, EOL);
    await promises.writeFile(filepath, resultString, 'utf-8');
    console.log(`Sorted JSON: ${filepath}`)
}

const isLuaSortable = async (filepath: string) => {

    const filename = path.basename(filepath);
    const extension = path.extname(filename);
    const lua = await promises.readFile(filepath, { encoding: 'utf-8' });

    if (extension && extension !== "lua") {
        return false;
    }

    try {
        const ast = luaparse.parse(lua);

        if (ast.type !== 'Chunk' || !ast.body) {
            return false;
        }

        for (const statement of ast.body) {
            let isMatch = false;

            // Check for LOCAL assignment: local Config = {...}
            if (statement.type === 'LocalStatement') {
                isMatch = statement.variables.some(v => v.name === filename);
                if (isMatch) return true;
            }

            // Check for GLOBAL assignment: Config = {...}
            else if (statement.type === 'AssignmentStatement') {
                isMatch = statement.variables.some(v => v.type === 'Identifier' && v.name === filename);
                if (isMatch) return true;
            }
        }
    }
    catch {
        console.log(`luaparse failed: ${filename}`);
    }
    return false;

}

const sortFile = async (filepath: string) => {

    const extension = path.extname(filepath);


    try {
        if (extension && jsonExtensions.includes(extension)) {
            await jsonSort(filepath);
        }
        else if (await isLuaSortable(filepath)) {
            await fengariSortFile(filepath);
        }
        else {
            console.log(`skipping: ${filepath}`);
        }
    } catch (err) {
        console.error(err);
    }


}

export const sortFiles = async (filePaths: string[]) => {
    for (const filepath of filePaths) {
        await sortFile(filepath);
    }

}