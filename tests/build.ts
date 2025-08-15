import path from 'path/posix'

console.clear()

// 无参数
// process.argv.push('build')

// 指定 root
process.argv.push('build', '--root=D:/web/pack/uxiu-cli/temp', '--tsconfig=./tsconfig.json')

import('../dist/index.js')
