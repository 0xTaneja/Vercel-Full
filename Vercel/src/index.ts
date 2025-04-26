import 'dotenv/config';
import express from "express";
import cors from "cors"
import {generate} from "./utils/generate"
import simpleGit from "simple-git";
import path from "path";
import {uploadFile} from "./utils/uploadService"
import {getAllFiles} from "./utils/getFolder"
import {createClient} from "redis"

// Define project root path - this resolves the path inconsistency
const PROJECT_ROOT = path.join(__dirname, '..');

const publisher = createClient();
publisher.connect();


const app = express();
app.use(cors())
app.use(express.json());


app.post("/deploy",async(req,res)=>{
const repoLink = req.body.repoLink;
const id = generate();
// Use absolute path for cloning
const outputPath = path.join(PROJECT_ROOT, 'output', id);
await simpleGit().clone(repoLink, outputPath);

// Use the same absolute path for finding files
const files = getAllFiles(outputPath);

files.forEach(async file => {
    // Calculate the relative path for S3 storage
    const relativeFilePath = file.slice(PROJECT_ROOT.length + 1);
    await uploadFile(relativeFilePath, file);
})

res.json({
    id:id
})

publisher.lPush("build-queue", id);
publisher.hSet("status",id,"uploaded");



})

app.get("/status",async(req,res)=>{
  const id = req.query.id;
  const response = await publisher.hGet("status",id as string)
  res.json({
    status:response
  })
})


app.get("/health",(req,res)=>{
    console.log("Routes are working")
})


app.listen(3000,()=>{
    console.log("Server is running on port 3000")
})


