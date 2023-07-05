# scratch-gpt README

This is the README for your extension "scratch-gpt". After writing up a brief description, we recommend including the following sections.

## Installation

Use pnpm to install dependencies:

pnpm i <package>

## How to use

1. Click run extension in lower left
2. navigate to a code file
3. use command+shift+c to copy code into the scratch file

## Features

- [x] Create scratch file
- [x] Copy code into scratch file using Shift+Command+C
- [ ] Sync scratch file modifications back to code file AND update all snippets in the scratch file

## Issues

- [x] Code is not copied on the first try
- [x] Always check if the scratch file exists before trying to copy code

## Format

// --- Original file: /path/to/test/file1.txt (Lines: 1-3) ---

## Update the source files from the scratch file

group snippets by file path
everytime a snippet gets saved, update all snippets from that file
update all the snippets lower in the source file -> update source lines.

click inside a function to copy the entire function to the scratch file.
