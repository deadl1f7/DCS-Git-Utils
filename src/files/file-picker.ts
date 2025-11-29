import { spawn } from "node:child_process";
import os from "node:os"

export async function pickMissionFileNative(): Promise<string> {
    const platform = os.platform();

    return new Promise((resolve, reject) => {
        let cmd = '';
        let args: string[] = [];

        if (platform === 'win32') {
            // WINDOWS: Use PowerShell with .NET Forms
            cmd = 'powershell';
            const psScript = `
                Add-Type -AssemblyName System.Windows.Forms
                $f = New-Object System.Windows.Forms.OpenFileDialog
                $f.Filter = "Mission Files (*.miz)|*.miz"
                $f.Title = "Select a DCS Mission File"
                $f.ShowHelp = $true
                $result = $f.ShowDialog()
                if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
                    Write-Host $f.FileName
                }
            `;
            // Encode command to avoid escaping issues
            args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript];
        }
        else if (platform === 'linux') {
            // LINUX: Use Zenity (Common on Ubuntu/Desktop Linux)
            cmd = 'zenity';
            args = ['--file-selection', '--file-filter=*.miz', '--title=Select a Mission File'];
        }
        else if (platform === 'darwin') {
            // MAC: Use AppleScript
            cmd = 'osascript';
            const appleScript = `
                set theFile to choose file with prompt "Select a Mission File" of type {"miz"}
                POSIX path of theFile
             `;
            args = ['-e', appleScript];
        }

        const child = spawn(cmd, args);
        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => { output += data.toString(); });
        child.stderr.on('data', (data) => { errorOutput += data.toString(); });

        child.on('close', (code) => {
            const resultPath = output.trim();
            if (code === 0 && resultPath) {
                resolve(resultPath);
            } else {
                // If user cancelled, usually code is 1 or path is empty
                reject(new Error("Selection cancelled"));
            }
        });

        child.on('error', (err) => {
            reject(new Error(`Failed to launch dialog: ${err.message}`));
        });
    });
}