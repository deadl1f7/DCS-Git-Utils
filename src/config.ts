import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import { getMizPath } from './files/miz-selector';

interface AppConfig {
    lastMissionPath: string | null;
    backupEnabled: boolean;
}

// 2. Define Defaults (Used if file is missing or partial)
const DEFAULT_CONFIG: AppConfig = {
    lastMissionPath: null,
    backupEnabled: false
};

export function saveConfig(data: AppConfig) {
    // 1. Determine the directory of the Executable
    // Check if we are running inside a 'pkg' executable
    const isPkg = (process as any).pkg !== undefined;

    const exeDir = isPkg
        ? path.dirname(process.execPath) // PROD: The folder containing .exe
        : process.cwd();                 // DEV: The folder where you ran 'npm start'

    // 2. Construct the full path
    const configPath = path.join(exeDir, 'config.json');

    try {
        // 3. Write the file
        fs.writeFileSync(configPath, JSON.stringify(data, null, 4), 'utf8');
        console.log(`Config saved to: ${configPath}`);
    } catch (err) {
        console.error(`Failed to write config`, err);
    }
}



export function readConfig(): AppConfig {
    // A. Determine the directory (Compatible with 'pkg')
    const isPkg = (process as any).pkg !== undefined;
    const exeDir = isPkg
        ? path.dirname(process.execPath) // PROD: Next to the .exe
        : process.cwd();                 // DEV: Current working directory

    const configPath = path.join(exeDir, 'config.json');

    // B. Check if file exists
    if (!fs.existsSync(configPath)) {
        console.log("No config found. Using defaults.");
        return DEFAULT_CONFIG;
    }

    try {
        // C. Read and Parse
        const rawData = fs.readFileSync(configPath, 'utf8');
        const userConfig = JSON.parse(rawData);

        // D. Merge with Defaults 
        // (Ensures your app doesn't crash if the user deletes a key from the JSON)
        return { ...DEFAULT_CONFIG, ...userConfig };

    } catch (err) {
        console.error(`Error reading config (corrupt JSON?)`, err);
        console.log("Reverting to default configuration.");
        return DEFAULT_CONFIG;
    }
}

export const initializeConfig = async (options?: { file?: string }) => {
    const config = readConfig();
    let missionPath = options?.file ?? "";
    let outDir = "";

    if (missionPath) {
        const mizDir = missionPath.replace(path.basename(missionPath), "");
        outDir = path.join(mizDir, "out");
    }
    else if (config.lastMissionPath === null) {
        const { mizPath, dir } = await getMizPath();
        missionPath = mizPath;
        outDir = path.join(dir, "out");
    } else {
        missionPath = config.lastMissionPath;
        const { action } = await inquirer.prompt([
            {
                type: 'rawlist',
                name: 'action',
                message: 'Target file already exists. What would you like to do?',
                choices: [
                    {
                        name: `Reuse the existing path: ${config.lastMissionPath}`,
                        value: 'reusePath'
                    },
                    {
                        name: "Select new .miz",
                        value: 'selectMiz'
                    }
                ]
            }
        ]);

        const mizDir = missionPath.replace(path.basename(missionPath), "");

        outDir = path.join(mizDir, "out");

        if (action === "selectMiz") {
            const { mizPath, dir } = await getMizPath(mizDir);
            missionPath = mizPath;
            outDir = path.join(dir, "out");;
        }


    }

    saveConfig({ ...config, lastMissionPath: missionPath });

    return { missionPath, outDir };
}