# Lit - A Lightweight Version Control System

Lit is a simple, Git-inspired version control system built in JavaScript. It provides basic version control functionality through a command-line interface.

## Features

- Initialize a new repository
- Add files to the staging area
- Commit changes with messages
- View commit history
- Display diff between commits

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd lit-vcs
npm install
```

Make the main script executable:

```bash
chmod +x main.mjs
```

You may want to create a symlink to use it system-wide:

```bash
npm link
```

## Usage

### Initialize a repository

```bash
lit init
```

Creates a new `.lit` repository in the current directory.

### Add files to staging area

```bash
lit add <filename>
```

Adds the specified file to the staging area.

### Commit changes

```bash
lit commit "Your commit message here"
```

Creates a commit with all files in the staging area.

### View commit history

```bash
lit log
```

Displays a history of all commits.

### Show commit diff

```bash
lit show <commit-hash>
```

Shows the differences introduced in the specified commit.

## Project Structure

- `.lit/` - Repository directory
  - `objects/` - Stores file content and commit objects
  - `HEAD` - Points to the current commit
  - `index` - Tracks staged files

## How It Works

Lit uses a simplified version of Git's internal model:

1. Content is hashed using SHA-1 and stored in the objects directory
2. Staging area is managed through the index file
3. Commits track files and link to parent commits
4. The HEAD file points to the latest commit

## License

[MIT License](LICENSE)
