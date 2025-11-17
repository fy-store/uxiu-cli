import path from 'path/posix'

console.clear()

// 无参数
process.argv.push('create')

// 获取帮助信息
// process.argv.push('--help', 'create')

// 携带 name 参数
// process.argv.push('create', '-n=test1')

// 携带 root 参数
// const r = path.join(process.cwd(), 'test/a')
// process.argv.push('create', `-r=${r}`)

// 携带 name, root 参数
// process.argv.push('create', '-n=test', '-r=test')

import('../src/index.js')
