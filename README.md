# vue-script-setup-migrate

_NB: this is still experimental_

Use this tool to automate your migration towards `<script setup>`
RFC: https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md

## Usage
### CLI

`npx vue-script-setup-migrate <blob>`
`yarn dlx vue-script-setup-migrate <blob>`

`vue-script-setup-migrate --help` to see all the available options

## Transform API
If you need more control, this tool exposes the core transform API as a default export:

`transformCode (inputCode: string): string -> output`

_Example:_
```
const fs = require('fs')
const transformCode = require('vue-script-setup-migrate')

const componentAsString = fs.readFileSync('MyComponent.vue', 'utf8')
const result = transformCode(componentAsString)

fs.writeFileSync('MyComponent.vue', result, 'utf8')
```