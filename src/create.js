import fs from 'fs'
import Path from 'path/posix'
import dayjs from 'dayjs'
import AdmZip from 'adm-zip'
import { conf } from './conf.js'

/**
 * @param {import('./types/index.ts').CreateOptions} options
 */
export const create = async (options) => {
	console.log(conf.color(`\n${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 正在下载模板...\n`))
	const resource = await getResource(options)
	console.log(conf.color(`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 模板下载完成, 正在解压...\n`))
	const zip = new AdmZip(resource)
	const zipEntries = zip.getEntries()
	if (zipEntries.length === 0) {
		console.log(conf.dangerColor(`${conf.errorEmoji}ZIP 文件为空或解析失败 !\n`))
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

	console.log(conf.color(`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 创建成功\n`))
	console.log(conf.color(`1. cd ${options.name}\n`))
	console.log(conf.color(`2. npm | pnpm i\n`))
	if (options.template !== 'default') {
		console.log(conf.color(`3. 更改 src/conf 数据库配置\n`))
		console.log(conf.color(`4. npm | pnpm dev\n`))
	} else {
		console.log(conf.color(`3. npm | pnpm dev\n`))
	}
}

/**
 * @param {import('./types/index.ts').CreateOptions} options
 */
const getResource = async (options) => {
	let res
	try {
		res = await fetch(conf.urls[options.template])
	} catch (error) {
		console.log(conf.dangerColor(`${conf.errorEmoji}获取模板资源失败, 请尝试更换网络环境/重新运行\n`))
		throw error
	}
	if (!res.ok) {
		throw new Error(conf.dangerColor(`${conf.errorEmoji}下载模板失败，HTTP 状态码: ${res.status}`))
	}
	const arrayBuffer = await res.arrayBuffer()
	return Buffer.from(arrayBuffer)
}
