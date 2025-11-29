import * as fs from 'fs';
import * as path from 'path';
import * as fengari from 'fengari';

const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
const to_luastring = fengari.to_luastring;

const scriptPath = path.join(__dirname, "../lua/sorter_lib.lua");

const runSorter = (dataFilePath: string, varName: string) => {
    // 1. Read the Data File
    const dataContent = fs.readFileSync(dataFilePath, 'utf8');

    // --- DETECT LINE ENDINGS ---
    // Check if the file contains Carriage Return + Line Feed
    const useCRLF = dataContent.includes("\r\n");
    const EOL = useCRLF ? "\r\n" : "\n";
    // ---------------------------

    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);

    // 2. Load Data into VM
    // Strip shebang just in case, convert to Lua String
    const cleanContent = dataContent.replace(/^#!\/.*\n/, "");
    let status = lauxlib.luaL_dostring(L, to_luastring(cleanContent));

    if (status !== lua.LUA_OK) {
        throw new Error(`Lua Load Error: ${lua.lua_tojsstring(L, -1)}`);
    }

    // 3. Load Sorter Logic
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    status = lauxlib.luaL_loadstring(L, to_luastring(scriptContent));

    if (status !== lua.LUA_OK) {
        throw new Error(`Script Load Error: ${lua.lua_tojsstring(L, -1)}`);
    }

    // 4. Run Sorter
    lua.lua_pushstring(L, varName);
    status = lua.lua_pcall(L, 1, 2, 0);

    if (status !== lua.LUA_OK) {
        throw new Error(`Runtime Error: ${lua.lua_tojsstring(L, -1)}`);
    }

    const errorMsg = lua.lua_tojsstring(L, -1);
    let resultString = lua.lua_tojsstring(L, -2); // This will contain \n

    if (!resultString && errorMsg) {
        throw new Error(`Logic Error: ${errorMsg}`);
    }

    resultString = resultString.replace(/\r?\n/g, EOL);

    // 5. Write back
    fs.writeFileSync(dataFilePath, resultString);
    console.log(`Success: Sorted ${varName}`);
};

export const fengariSortFile = (filepath: string) => {
    const targetVar = path.basename(filepath);
    runSorter(filepath, targetVar);

}