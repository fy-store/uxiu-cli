import fs from 'fs'
import Path from 'path/posix'
import dayjs from 'dayjs'
import AdmZip from 'adm-zip'
import { conf } from './conf.js'

/**
 * @param {import('./types/index.ts').CreateOptions} options
 */
export const create = async (options) => {
	console.log('')
	console.log(conf.color(`✔ ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 正在下载模板...`))
	console.log('')
	const resource = await getResource(options)
	console.log(conf.color(`✔ ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 模板下载完成, 正在解压...`))
	console.log('')
	const zip = new AdmZip(resource)
	const zipEntries = zip.getEntries()
	if (zipEntries.length === 0) {
		console.log(conf.dangerColor('✖ ZIP 文件为空或解析失败！🐶'))
		console.log('')
		return
	}

	zipEntries.forEach((entry) => {
		if (entry.isDirectory) return
		const entryName = entry.entryName.replace(conf.replaceStrs[options.template], '')
		if (entryName === '') return
		if (entryName === 'package.json') {
			const content = JSON.parse(entry.getData().toString('utf8'))
			content.name = options.name
			content.version = '0.0.0'
			const filePath = Path.join(options.root, options.name, entryName)
			fs.mkdirSync(Path.dirname(filePath), { recursive: true })
			fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8')
		} else {
			const filePath = Path.join(options.root, options.name, entryName)
			fs.mkdirSync(Path.dirname(filePath), { recursive: true })
			fs.writeFileSync(filePath, entry.getData())
		}
	})

	console.log(conf.color(`✔ ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 创建成功`))
	console.log('')
	console.log(conf.color(`1. cd ${options.name}`))
	console.log('')
	console.log(conf.color(`2. npm | pnpm i`))
	console.log('')
	if (options.template !== 'default') {
		console.log(conf.color(`3. 更改 src/conf 数据库配置`))
		console.log('')
		console.log(conf.color(`4. npm | pnpm dev`))
		console.log('')
	} else {
		console.log(conf.color(`3. npm | pnpm dev`))
		console.log('')
	}
}

/**
 * @param {import('./types/index.ts').CreateOptions} options
 */
const getResource = async (options) => {
	const res = await fetch(conf.urls[options.template])
	if (!res.ok) {
		throw new Error(`✖ 下载模板失败，HTTP 状态码: ${res.status}`)
	}
	const arrayBuffer = await res.arrayBuffer()
	return Buffer.from(arrayBuffer)
}
