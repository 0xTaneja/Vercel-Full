import express from "express";
import {S3} from "aws-sdk";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    endpoint: process.env.AWS_ENDPOINT,
});

const app = express();

app.get("/*",async(req,res)=>{
    try {
        const host = req.hostname;
        const id = host.split(".")[0];
        const filePath = req.path;
        
        // Default to index.html for root path
        const key = `dist/${id}${filePath === '/' ? '/index.html' : filePath}`;
        
        const contents = await s3.getObject({
            Bucket: "vercel",
            Key: key
        }).promise();
    
        const type = filePath.endsWith("html") ? "text/html" : 
                     filePath.endsWith("css") ? "text/css" : 
                     filePath.endsWith("js") ? "application/javascript" :
                     "application/octet-stream";
        
        res.set("Content-Type", type);
        res.send(contents.Body);
    } catch (error) {
        console.error("Error serving file:", error);
        res.status(404).send("File not found");
    }
});

app.listen(3001,()=>{
    console.log("Server is running on port 3001");
})