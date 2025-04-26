import path from 'path';
import fs from 'fs';
import {S3} from 'aws-sdk';
import {createClient} from 'redis';
import 'dotenv/config';

// Define project root path for consistency with other files
const PROJECT_ROOT = path.join(__dirname, '../..');

const publisher = createClient();
publisher.connect();

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    endpoint: process.env.AWS_ENDPOINT,
});

export async function copyFinalDist(id: string) {
    // Use PROJECT_ROOT instead of __dirname
    const folderPath = path.join(PROJECT_ROOT, 'output', id, 'dist');
    const allFiles = getAllFiles(folderPath);
    
    // Process all uploads
    const uploadPromises = allFiles.map(file => {
        return uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
    });
    
    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
    
    // Update status to deployed
    await publisher.hSet("status", id, "deployed");
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
    const response = await s3.upload({
        Body: fileContent,
        Bucket: "vercel",
        Key: fileName,
    }).promise();
    console.log(response);
} 