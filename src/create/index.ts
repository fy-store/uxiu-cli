import type { CreateOptions, CreateParams, GetResourceOptions } from '@/types/index.js'
import type { Argv, ArgumentsCamelCase } from 'yargs'
import fs from 'fs'
import path from 'path/posix'
import conf from '../conf/index.js'
import { input, select } from '@inquirer/prompts'
import AdmZip from 'adm-zip'
import dayjs from 'dayjs'

const root = process.cwd()

export const command = 'create [name] [root]'

export const describe = '创建项目'

export async function commandHandle(yargs: Argv<CreateOptions | Record<string, any>>) {
	yargs
		.option('name', {
			desc: '项目名称, 通过该选项指定项目名称',
			type: 'string',
			alias: 'n'
		})
		.option('root', {
			desc: '项目根目录, 通过该选项指定创建项目的根(绝对路径)',
			type: 'string',
			alias: 'r',
			default: root
		})
}

export async function execute(options: ArgumentsCamelCase<CreateOptions>) {
	let params: CreateParams | null = null
	try {
		const { root } = options
		let name = ''
		if (options.name) {
			const fullPath = path.join(root, options.name)
			if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
				console.log('')
				console.log(conf.dangerColor(`${conf.errorEmoji} "${options.name}" 文件夹已存在，请更换名称或移除`), '\n')
				return
			}
			name = options.name
		} else {
			console.log('')
			while (!name) {
				const value = await input({
					message: '请输入项目名称',
					required: true,
					theme: {
						prefix: {
							done: conf.color(`${conf.successEmoji}`),
							idle: conf.color(`${conf.doubtEmoji}`)
						},
						style: {
							error() {
								return `\n${conf.dangerColor('请输入..')}\n`
							}
						}
					}
				})
				const fullPath = path.join(root, value)
				if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
					console.log('')
					console.log(conf.dangerColor(`${conf.errorEmoji} "${value}" 文件夹已存在，请更换名称或移除`), '\n')
				} else {
					name = value
				}
			}
		}

		const projectPath = path.join(root, name)
		console.log('')

		const templateId = await select({
			message: '请选择模板',
			choices: [
				{ name: '标准模板', value: 'default' },
				{ name: 'monorepo-vue3-raw-sql 模板', value: 'monorepo-vue3-raw-sql' }
			],
			theme: {
				prefix: {
					done: conf.color(`${conf.successEmoji}`),
					idle: conf.color(`${conf.doubtEmoji}`)
				},
				style: {
					help() {
						return conf.tipColor('(按上下箭头进行选择)')
					},
					error() {
						return `\n${conf.dangerColor('请选择..')}\n`
					}
				}
			}
		})

		params = {
			root,
			name,
			templateId,
			projectPath
		}
	} catch (error) {
		if (error instanceof Error && error.name === 'ExitPromptError') {
			console.log(`\n${conf.byeEmoji} 下次再见 !\n`)
			process.exit(0)
		} else {
			throw error
		}
	}

	if (params) {
		await actuator(params)
	}
}

async function actuator(params: CreateParams) {
	console.log('')
	console.log(conf.color(`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 正在下载模板...`), '\n')
	const resource = await getResource(params)
	console.log(
		conf.color(`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 模板下载完成, 正在解压...`),
		'\n'
	)

	// 解压文件
	const zip = new AdmZip(resource)
	const zipEntries = zip.getEntries()
	if (zipEntries.length === 0) {
		console.log(conf.dangerColor(`${conf.errorEmoji}ZIP 文件为空或解析失败 !`), '\n')
		return
	}

	// 复制文件
	zipEntries.forEach((entry) => {
		if (entry.isDirectory) return
		const entryName = entry.entryName.replace(conf.replaceStrs[params.templateId], '')
		if (entryName === '') return
		if (entryName === 'package.json') {
			const content = JSON.parse(entry.getData().toString('utf8'))
			content.name = params.name
			content.version = '0.0.0'
			const filePath = path.join(params.root, params.name, entryName)
			fs.mkdirSync(path.dirname(filePath), { recursive: true })
			fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8')
		} else {
			const filePath = path.join(params.root, params.name, entryName)
			fs.mkdirSync(path.dirname(filePath), { recursive: true })
			fs.writeFileSync(filePath, entry.getData())
		}
	})

	console.log(conf.color(`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 创建成功`), '\n')
	const p = path.join(params.root, params.name).replaceAll('\\', '/')
	const r = path.join(root).replaceAll('\\', '/')
	if (p.startsWith(r)) {
		const relativePath = p.replace(r, '')
		console.log(conf.color(`1. cd ${relativePath.startsWith('/') ? relativePath.slice(1) : relativePath}`), '\n')
	} else {
		console.log(conf.color(`1. cd ${p}`), '\n')
	}
	console.log(conf.color(`2. npm | pnpm i`), '\n')
	console.log(conf.color(`3. npm | pnpm dev`), '\n')
}

/** 获取模板资源 */
async function getResource(options: GetResourceOptions) {
	let res: Response
	try {
		res = await fetch(conf.urls[options.templateId])
	} catch (error) {
		console.log(conf.dangerColor(`${conf.errorEmoji} 获取模板资源失败, 请尝试更换网络环境/重新运行`), '\n')
		throw error
	}
	if (!res.ok) {
		throw new Error(conf.dangerColor(`${conf.errorEmoji} 下载模板失败，HTTP 状态码: ${res.status}`))
	}
	const arrayBuffer = await res.arrayBuffer()
	return Buffer.from(arrayBuffer)
}
