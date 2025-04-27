import express from "express";
import {S3} from "aws-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    endpoint: process.env.AWS_ENDPOINT,
});

const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Simple route for testing
app.get("/health", (req, res) => {
    res.send("Request service is running");
});

// Instead of app.get("*"), use app.use() which doesn't have the same path-to-regexp issue
app.use(async(req, res) => {
    
        // id.100xdevs.com
        const host = req.hostname;
    
        const id = host.split(".")[0];
        const filePath = req.path === "/" ? "/index.html" : req.path;
        
        console.log(`Trying to serve: ${id} with path: ${filePath}`);
    
        try {
            const s3Key = `dist/${id}/${filePath.substring(1)}`;
            console.log(`Fetching from S3: ${s3Key}`);
            
            const contents = await s3.getObject({
                Bucket: "vercel",
                Key: s3Key
            }).promise();
            
            console.log(`Successfully fetched ${s3Key}`);
            
            // Improved content type detection
            let type;
            if (filePath.endsWith(".html")) {
                type = "text/html";
            } else if (filePath.endsWith(".css")) {
                type = "text/css";
            } else if (filePath.endsWith(".js")) {
                type = "application/javascript";
            } else if (filePath.endsWith(".svg")) {
                type = "image/svg+xml";
                // Log a sample of the SVG content if it exists
                if (contents.Body) {
                    try {
                        const bodyStr = contents.Body.toString('utf-8').substring(0, 50);
                        console.log(`SVG content sample: ${bodyStr}...`);
                    } catch (err) {
                        console.log("Could not convert SVG content to string");
                    }
                }
            } else if (filePath.endsWith(".png")) {
                type = "image/png";
            } else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
                type = "image/jpeg";
            } else if (filePath.endsWith(".gif")) {
                type = "image/gif";
            } else if (filePath.endsWith(".ico")) {
                type = "image/x-icon";
            } else {
                type = "application/octet-stream";
            }
            
            // Set proper caching headers
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.setHeader('Content-Type', type);
            
            // Return the file content
            res.send(contents.Body);
            console.log(`Served ${s3Key} with content type: ${type}`);
        } catch (error) {
            console.error(`Error fetching: dist/${id}/${filePath.substring(1)}`);
            console.error(error);
            res.status(404).send("Not Found");
        }

});

app.listen(3001, () => {
    console.log("Request service is running on port 3001");
});