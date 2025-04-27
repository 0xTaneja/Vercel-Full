import path from 'path';
import fs from 'fs';
import {S3} from 'aws-sdk';
import {createClient} from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define correct path to the Vercel service output folder
const VERCEL_ROOT = path.join(__dirname, '../../../Vercel');

const publisher = createClient();
publisher.connect();

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    endpoint: process.env.AWS_ENDPOINT,
});

// Helper function to determine content type based on file extension
function getContentType(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
        case '.html': return 'text/html';
        case '.css': return 'text/css';
        case '.js': return 'application/javascript';
        case '.svg': return 'image/svg+xml';
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.gif': return 'image/gif';
        case '.ico': return 'image/x-icon';
        case '.json': return 'application/json';
        case '.txt': return 'text/plain';
        case '.pdf': return 'application/pdf';
        default: return 'application/octet-stream';
    }
}

export async function copyFinalDist(id: string) {
    try {
        // Look for dist folder in the Vercel output directory
        const folderPath = path.join(VERCEL_ROOT, 'output', id, 'dist');
        console.log(`Looking for dist folder at: ${folderPath}`);
        
        // Check if dist directory exists (some frameworks use different output directories)
        if (!fs.existsSync(folderPath)) {
            console.error(`Dist folder not found at ${folderPath}`);
            await publisher.hSet("status", id, "build-failed");
            return;
        }
        
        const allFiles = getAllFiles(folderPath);
        console.log(`Found ${allFiles.length} files to upload`);
        
        // Process all uploads
        const uploadPromises = allFiles.map(file => {
            const uploadPath = `dist/${id}/` + file.slice(folderPath.length + 1);
            return uploadFile(uploadPath, file);
        });
        
        // Wait for all uploads to complete
        await Promise.all(uploadPromises);
        
        // Update status to deployed
        await publisher.hSet("status", id, "deployed");
        console.log(`Successfully deployed ${allFiles.length} files for ID: ${id}`);
    } catch (error) {
        console.error(`Error deploying files for ID ${id}:`, error);
        await publisher.hSet("status", id, "deployment-failed");
    }
}

const getAllFiles = (folderPath: string) => {
    let response: string[] = [];

    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach(file => {
        const fullFilePath = path.join(folderPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath))
        } else {
            response.push(fullFilePath);
        }
    });
    return response;
}

const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);
    const contentType = getContentType(localFilePath);
    
    console.log(`Uploading ${fileName} with content type: ${contentType}`);
    
    const response = await s3.upload({
        Body: fileContent,
        Bucket: "vercel",
        Key: fileName,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000'
    }).promise();
    
    return response;
} 