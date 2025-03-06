import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
class Bat {
  constructor(repoPath = ".") {
    this.repoPath = path.join(repoPath, ".bat");
    this.objectsPath = path.join(this.repoPath, "objects");
    this.headsPath = path.join(this.repoPath, "HEAD");
    this.indexPath = path.join(this.repoPath, "index");
    this.init();
  }
  // function to initiate bat i.e. equivalent of git init
  async init() {
    await fs.mkdir(this.objectsPath, { recursive: true });
    try {
      await fs.writeFile(this.headsPath, "", { flag: "wx" });
      await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: "wx" });
      console.log("new bat repo intialised");
    } catch (err) {
      console.log("bat repo already initialised in the folder");
    }
  }
  // helper function to produce hash of content
  hashObject(content) {
    return crypto.createHash("sha1").update(content, "utf-8").digest("hex");
  }
  // implementing the git add functionality
  async add(fileToBeAdded) {
    const fileData = await fs.readFile(fileToBeAdded, { encoding: "utf-8" });
    const fileHash = this.hashObject(fileData);
    console.log(fileHash);
    const newHashedFileObjectPath = path.join(this.objectsPath, fileHash);
    await fs.writeFile(newHashedFileObjectPath, fileData);
    await this.updateStagingArea(fileToBeAdded, fileHash);
    console.log(`Added ${fileToBeAdded}`);
  }
  // helper function to staging the files in index file
  async updateStagingArea(filePath, fileHash) {
    const index = JSON.parse(
      await fs.readFile(this.indexPath, { encoding: "utf-8" })
    ); // getting the stage which is tracked in index
    index.push({ path: filePath, hash: fileHash }); // pushing the acurrent file hash in the index array
    await fs.writeFile(this.indexPath, JSON.stringify(index)); // writing back array in index file
  }
  // commit function
  async commit(messege) {
    const index = JSON.parse(
      await fs.readFile(this.indexPath, { encoding: "utf-8" })
    );
    const parentCommit = await this.getCurrentHead();
    const commitData = {
      timeStamp: new Date().toISOString(),
      messege: messege,
      files: index,
      parent: parentCommit,
    };
    const commitHash = this.hashObject(JSON.stringify(commitData));
    const commitPath = path.join(this.objectsPath, commitHash); // create commit path in objects
    await fs.writeFile(commitPath, JSON.stringify(commitData)); // commit hashes are stored in objects
    await fs.writeFile(this.headsPath, commitHash); // update head to point to the new commit
    await fs.writeFile(this.indexPath, JSON.stringify([])); // empty the staging area
    console.log("Commit created successfully: " + commitHash);
  }

  async getCurrentHead() {
    try {
      return await fs.readFile(this.headsPath, { encoding: "utf-8" });
    } catch (error) {
      console.log("issue in getCurrentHead fn");
    }
  }
}
(async () => {
  const bat = new Bat();
  await bat.add("sampleFile.txt");
  await bat.commit("intial commit");
})();
