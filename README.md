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
- [ ] Sync scratch file modifications back to code file
- [ ] Update scratch file when code file is modified (avoid loop)

## Issues

- [x] Code is not copied on the first try
- [x] Always check if the scratch file exists before trying to copy code
