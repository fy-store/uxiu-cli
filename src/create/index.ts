import type { CreateOptions, CreateParams, GetResourceOptions } from '@/types/index.js'
import type { Argv, ArgumentsCamelCase } from 'yargs'
import fs from 'fs'
import path from 'path/posix'
import { config } from '../config/index.js'
import { input, select } from '@inquirer/prompts'
import AdmZip from 'adm-zip'
import dayjs from 'dayjs'
import fetchSource, { FetchError } from '@/utils/fetchSource/index.js'

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
				console.log(config.dangerColor(`${config.errorEmoji} "${options.name}" 文件夹已存在，请更换名称或移除`), '\n')
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
							done: config.color(`${config.successEmoji}`),
							idle: config.color(`${config.doubtEmoji}`)
						},
						style: {
							error() {
								return `\n${config.dangerColor('请输入..')}\n`
							}
						}
					}
				})
				const fullPath = path.join(root, value)
				if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
					console.log('')
					console.log(config.dangerColor(`${config.errorEmoji} "${value}" 文件夹已存在，请更换名称或移除`))
					console.log('')
				} else {
					name = value
				}
			}
		}

		const projectPath = path.join(root, name)
		console.log('')

		const templateId = await select({
			message: '请选择模板',
			choices: Object.entries(config.templates).map(([key, value]) => {
				return { name: value.name, value: key }
			}),
			theme: {
				prefix: {
					done: config.color(`${config.successEmoji}`),
					idle: config.color(`${config.doubtEmoji}`)
				},
				style: {
					help() {
						return config.tipColor('(按上下箭头进行选择)')
					},
					error() {
						return `\n${config.dangerColor('请选择..')}\n`
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
			console.log(`\n${config.byeEmoji} 下次再见 !\n`)
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
	console.log(config.color(`${config.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 正在下载模板...`))
	console.log('')
	const resource = await getResource(params)
	console.log(
		config.color(`${config.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 模板下载完成, 正在解压...`)
	)
	console.log('')

	// 解压文件
	const zip = new AdmZip(resource)
	const zipEntries = zip.getEntries()
	if (zipEntries.length === 0) {
		console.log(config.dangerColor(`${config.errorEmoji}ZIP 文件为空或解析失败 !`))
		console.log('')
		return
	}

	// 复制文件
	await Promise.all(
		zipEntries.map(async (entry) => {
			if (entry.isDirectory) return
			const template = config.templates[params.templateId as keyof typeof config.templates]
			const entryName = entry.entryName.replace(`${template.replaceName}/`, '')
			if (entryName === '') return
			if (entryName === 'package.json') {
				const content = JSON.parse(entry.getData().toString('utf8'))
				content.name = params.name
				content.version = '0.0.0'
				const filePath = path.join(params.root, params.name, entryName)
				await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
				await fs.promises.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8')
			} else {
				const filePath = path.join(params.root, params.name, entryName)
				await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
				await fs.promises.writeFile(filePath, entry.getData())
			}
		})
	)

	console.log(
		config.color(`${config.successEmoji} ${params.name}: 创建成功 ${dayjs().format('YYYY/MM/DD HH:mm:ss')}`),
		'\n'
	)
	const p = path.join(params.root, params.name).replaceAll('\\', '/')
	const r = path.join(root).replaceAll('\\', '/')
	if (p.startsWith(r)) {
		const relativePath = p.replace(r, '')
		console.log(config.color(`1. cd ${relativePath.startsWith('/') ? relativePath.slice(1) : relativePath}`))
		console.log('')
	} else {
		console.log(config.color(`1. cd ${p}`))
		console.log('')
	}
	console.log(config.color(`2. npm | pnpm i`))
	console.log('')
	console.log(config.color(`3. npm | pnpm dev`))
	console.log('')
}

/** 获取模板资源 */
async function getResource(options: GetResourceOptions): Promise<Buffer<ArrayBuffer>> {
	const template = config.templates[options.templateId as keyof typeof config.templates]
	let res: Buffer<ArrayBuffer>
	for (let i = 0; i < template.list.length; i++) {
		const it = template.list[i]
		try {
			const url = `https://${it.host}/${it.store}/${it.ref}.zip`
			const response = await fetchSource<ArrayBuffer>(url, {
				timeout: 1000 * 15,
				retries: 3,
				responseType: 'arraybuffer'
			})
			fs.writeFileSync('./test.zip', Buffer.from(response.data))
			res = Buffer.from(response.data)
		} catch (err) {
			if (i === template.list.length - 1) {
				if (err instanceof FetchError) {
					switch (err.type) {
						case 'network':
							console.log(config.dangerColor(`${config.errorEmoji} 网络异常，请检查连接`))
							console.log('')
							break
						case 'http':
							console.log(
								config.dangerColor(`${config.errorEmoji} 服务器 ${err.status} 错误: ${err.response?.statusText || ''}`)
							)
							console.log('')
							break
						case 'timeout':
							console.log(config.dangerColor(`${config.errorEmoji} 请求超时`))
							console.log('')
							break
						default:
							console.log(config.dangerColor(`${config.errorEmoji} 未知错误`))
							console.log('')
							break
					}
				} else {
					console.log(config.dangerColor(`${config.errorEmoji} 获取模板资源失败, 未知错误`))
					console.log('')
					throw err
				}
			} else {
				console.log(`正在换源重试, 第 ${i} 次`)
			}
		}
	}
	return res!
}
