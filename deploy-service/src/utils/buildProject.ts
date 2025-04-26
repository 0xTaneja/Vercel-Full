import {exec} from 'child_process';
import path from 'path';

// Define project root path for consistency with other files
const PROJECT_ROOT = path.join(__dirname, '../..');

export function buildProject(id: string) {
    return new Promise((resolve) => {
        // Use PROJECT_ROOT instead of __dirname to correctly locate the output directory
        const outputPath = path.join(PROJECT_ROOT, 'output', id);
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