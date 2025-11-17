import path from 'path/posix'

console.clear()

// 无参数
// process.argv.push('build')

// 指定 root
process.argv.push('build', '--pwd=D:/packs/uxiu-cli/temp')

import('../dist/index.js')
