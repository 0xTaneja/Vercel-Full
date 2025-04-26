import {createClient, commandOptions} from 'redis';
import {buildProject} from './utils/buildProject';
import {copyFinalDist} from './utils/deploymentService';

const subscriber = createClient();
subscriber.connect();

async function main() {
    while(1) {
        try {
            const res = await subscriber.brPop(
                commandOptions({ isolated: true }),
                'build-queue',
                0
            );
            
            if (res?.element) {
                const id = res.element;
                console.log(`Building project with ID: ${id}`);
                
                // Build the project
                await buildProject(id);
                
                // Deploy the build output
                await copyFinalDist(id);
                
                console.log(`Deployment completed for ID: ${id}`);
            }
        } catch (error) {
            console.error("Error in build process:", error);
        }
    }
}

// Start the main loop
main().catch(console.error);
