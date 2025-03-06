#! /usr/bin/env node
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { diffLines } from "diff";
import chalk from "chalk";
import { program } from "commander";
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
  // git log function
  async log() {
    let currentCommitHead = await this.getCurrentHead(); // get hash of latest commit
    // get the data of latest commit
    while (currentCommitHead) {
      let commitData = JSON.parse(
        await fs.readFile(path.join(this.objectsPath, currentCommitHead), {
          encoding: "utf-8",
        })
      );
      console.log(`commit: ${currentCommitHead}\n
        Date: ${commitData.timeStamp}\n
        Messege: ${commitData.messege}\n
        ----------------------------------\n`);

      currentCommitHead = commitData.parent;
    }
  }
  async getCommitData(commitHash) {
    const commitPath = path.join(this.objectsPath, commitHash);
    try {
      return await fs.readFile(commitPath, { encoding: "utf-8" });
    } catch (error) {
      console.log(
        `Error is fetching commit data for hash: ${commitHash} with error: ${error}`
      );
    }
  }
  async getFileContent(fileHash) {
    const objectPath = path.join(this.objectsPath, fileHash);
    return await fs.readFile(objectPath, { encoding: "utf-8" });
  }
  async getParentFileContent(parentCommitData, filePath) {
    const parentFile = parentCommitData.files.find(
      (file) => file.path === filePath
    );
    if (parentFile) {
      return await this.getFileContent(parentFile.hash);
    }
  }
  async showCommitDiff(commitHash) {
    const commitData = JSON.parse(await this.getCommitData(commitHash));
    if (!commitData) {
      console.log("Commit not Found ");
      return;
    }
    console.log("Changes in the last commit was:");
    for (const file of commitData.files) {
      console.log(`File: ${file.path}`);
      const fileContent = await this.getFileContent(file.hash);
      // console.log(fileContent);

      if (commitData.parent) {
        const parentCommitData = JSON.parse(
          await this.getCommitData(commitData.parent)
        );
        const parentFileContent = await this.getParentFileContent(
          parentCommitData,
          file.path
        );
        if (parentFileContent !== undefined) {
          const diff = diffLines(parentFileContent, fileContent);
          // console.log(diff);
          diff.forEach((part) => {
            if (part.added) {
              process.stdout.write(chalk.green("++" + part.value));
            } else if (part.removed) {
              process.stdout.write(chalk.red("--" + part.value));
            } else {
              process.stdout.write(chalk.gray(part.value));
            }
          });
          console.log(); //
        } else {
          console.log("New File in this commit");
        }
      } else {
        console.log("First Commit");
      }
    }
  }
}

// Function Testing calls

// (async () => {
//   const bat = new Bat();
//   await bat.add("sampleFile.txt");
//   await bat.add("sample2.txt");
//   await bat.commit("8th commit");
//   await bat.showCommitDiff("abc1328621d78d766c32865639aed9ffe8b5f597");
//   await bat.log();
// })();

// Command line Arguments
program.command("init").action(async () => {
  const bat = new Bat();
});

program.command("add <file>").action(async (file) => {
  const bat = new Bat();
  await bat.add(file);
});

program.command("commit <message>").action(async (message) => {
  const bat = new Bat();
  await bat.commit(message);
});
program.command("log").action(async () => {
  const bat = new Bat();
  await bat.log();
});
program.command("show <commitHash>").action(async (commitHash) => {
  const bat = new Bat();
  await bat.showCommitDiff(commitHash);
});

program.parse(process.argv);
