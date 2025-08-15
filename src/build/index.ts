import type { ArgumentsCamelCase, Argv } from 'yargs'
import type { CliOptions } from './types.js'
import type { Options, BuildEvent, Params } from './types.js'
import { Options as TsdownOptions, build } from 'tsdown'
import fs from 'fs'
import path from 'path/posix'
import Event from '@yishu/event'
import dayjs from 'dayjs'
import conf from '../conf/index.js'
import { extract, isObject, omit } from 'uxiu'
import { pathToFileURL } from 'url'

const rootPath = process.cwd()
export const command = 'build [pwd] [entry] [outDir] [config]'
export const describe = '打包项目'

export async function commandHandle(yargs: Argv<CliOptions>) {
	yargs
		.option('pwd', {
			alias: 'p',
			desc: '项目工作目录',
			type: 'string',
			default: rootPath
		})
		.option('entry', {
			alias: 'e',
			desc: '项目入口文件',
			type: 'string',
			default: './src/index.ts'
		})
		.option('outDir', {
			alias: 'o',
			desc: '输出目录',
			type: 'string',
			default: './dist'
		})
		.option('config', {
			alias: 'c',
			desc: 'uxiu-cli 配置路径',
			type: 'string',
			default: './uxiu-cli.config.ts'
		})
}

export async function execute(options: ArgumentsCamelCase<Required<CliOptions>>) {
	const params = {} as Params
	const bus = new Event<BuildEvent>()
	params.bus = bus

	// 载入配置文件
	const configFullPath = path.join(options.pwd, options.config)
	if (fs.existsSync(configFullPath) && fs.statSync(configFullPath).isFile()) {
		const _c = await import(pathToFileURL(configFullPath).href)
		const config = _c.default as Options
		if (!isObject(config)) {
			throw new Error('Invalid uxiu-cli config')
		}

		if (config.event) {
			Object.keys(config.event).forEach((key) => {
				bus.on(key, config.event[key])
			})
		}

		if (bus.has('beforeBuild')) bus.emit('beforeBuild')
		if (bus.has('hook:beforeBuild')) await bus.emitLineUp('hook:beforeBuild')
		Object.assign(params, config)
	}

	// 写入命令行参数
	Object.assign(
		params,
		extract<CliOptions, keyof CliOptions>(options, ['pwd', 'entry', 'outDir', 'config'], {
			notValueWriteUndefined: false
		})
	)

	await actuator(params)
}

async function actuator(params: Params) {
	const tsdownConfig: TsdownOptions = {
		...omit(params, ['event', 'config', 'bus', 'tsdownOptions']),
		...(params.tsdownOptions ?? {})
	}

	console.log('')
	console.log(conf.color(`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 开始构建...`), '\n')
	const startTimer = Date.now()

	try {
		await build(tsdownConfig)
		// 处理 package
		const packagePath = path.join(params.pwd, 'package.json')
		if (fs.existsSync(packagePath)) {
			const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
			content.main = './index.js'
			content.scripts = {
				start: 'node ./index.js'
			}
			delete content.devDependencies
			fs.writeFileSync(path.join(params.pwd, params.outDir, 'package.json'), JSON.stringify(content, null, 2), 'utf8')
		}

		// 打包结束事件
		if (params.bus.has('afterBuild')) params.bus.emit('afterBuild')
		if (params.bus.has('hook:afterBuild')) await params.bus.emitLineUp('hook:afterBuild')

		console.log(
			'\n',
			conf.color(
				`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 构建完成，耗时 ${
					(Date.now() - startTimer) / 1000
				} 秒`
			),
			'\n'
		)
	} catch (error) {
		if (params.bus.has('error')) params.bus.emit('error', error)
		if (params.bus.has('hook:error')) await params.bus.emitLineUp('hook:error', error)
		console.log(conf.dangerColor(`${conf.errorEmoji} 构建失败，错误信息：`), '\n')
		throw error
	}
}
