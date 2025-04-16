import path from 'path/posix'

console.clear()

// 无参数
// process.argv.push('build')

// 指定 root
process.argv.push('build', '--root=D:/web/work/uxiu-cli/testBuild', '--tsconfig=./tsconfig.json')

import('../dist/index.js')
