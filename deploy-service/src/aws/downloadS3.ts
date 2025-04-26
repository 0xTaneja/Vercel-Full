import {S3} from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Define project root path for consistency with index.ts
const PROJECT_ROOT = path.join(__dirname, '../..');

const s3 = new S3({
    accessKeyId:process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    endpoint: process.env.AWS_ENDPOINT,
})

export async function downloadS3Folders(prefix:string) {
    const allFiles = await s3.listObjectsV2({
        Bucket: 'vercel',
        Prefix:prefix
    }).promise();

    const allPromises = allFiles.Contents?.map(async ({Key})=>{
        return new Promise(async (resolve)=>{
            if(!Key)
            {
                resolve("");
                return;
            }
            // Use PROJECT_ROOT instead of __dirname
            const finalOutputPath = path.join(PROJECT_ROOT, Key);
            const outputFile = fs.createWriteStream(finalOutputPath);
            const dirName = path.dirname(finalOutputPath);
            if (!fs.existsSync(dirName)){
                fs.mkdirSync(dirName, { recursive: true });
            }
            s3.getObject({
                Bucket: "vercel",
                Key
            }).createReadStream().pipe(outputFile).on("finish", () => {
                resolve("");
            })
        })
    }) || [];
    console.log("awaiting");

    await Promise.all(allPromises?.filter(x => x !== undefined));
} 