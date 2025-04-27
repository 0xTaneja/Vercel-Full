import {exec} from 'child_process';
import path from 'path';

// Define correct path to the Vercel service output folder
const VERCEL_ROOT = path.join(__dirname, '../../../Vercel');

export function buildProject(id: string) {
    return new Promise((resolve) => {
        // Look for repositories in the Vercel output directory, not deploy-service
        const outputPath = path.join(VERCEL_ROOT, 'output', id);
        console.log(`Building project at: ${outputPath}`);
        
        const child = exec(`cd ${outputPath} && npm install && npm run build`);
        
        child.stdout?.on('data', function(data) {
            console.log('stdout: ' + data);
        });
        
        child.stderr?.on('data', function(data) {
            console.log('stderr: ' + data);
        });
        
        child.on('close', function(code) {
            console.log(`Build process exited with code ${code}`);
            resolve("");
        });
    });
} 