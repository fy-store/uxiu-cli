import type { ArgumentsCamelCase, Argv } from 'yargs'
import type { CliOptions, Ctx, DefaultOptions, TsdownConfig } from './types.js'
import type { Options, BuildEvent } from './types.js'
import { Options as TsdownOptions, build } from 'tsdown'
import fs from 'fs'
import path from 'path/posix'
import Event from '@yishu/event'
import dayjs from 'dayjs'
import conf from '../conf/index.js'
import { extract, isObject } from 'uxiu'
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

export async function execute(cliOptions: ArgumentsCamelCase<Required<CliOptions>>) {
	const keys: (keyof DefaultOptions)[] = ['pwd', 'entry', 'outDir']
	const ctx: Ctx = {
		pwd: cliOptions.pwd,
		cliOptions,
		bus: new Event<BuildEvent>(),
		options: null,
		tsdownConfig: {} as TsdownConfig
	}

	// 载入配置文件
	const configFullPath = path.join(cliOptions.pwd, cliOptions.config)
	if (fs.existsSync(configFullPath) && fs.statSync(configFullPath).isFile()) {
		const _c = await import(pathToFileURL(configFullPath).href)
		const config = _c.default as Options
		if (!isObject(config)) {
			throw new Error('Invalid uxiu-cli config')
		}

		ctx.options = config

		if (config.event) {
			Object.keys(config.event).forEach((key) => {
				ctx.bus.on(key, config.event[key])
			})
		}

		if (ctx.bus.has('beforeBuild')) ctx.bus.emit('beforeBuild', ctx)
		if (ctx.bus.has('hook:beforeBuild')) await ctx.bus.emitLineUp('hook:beforeBuild', ctx)
		Object.assign(ctx.tsdownConfig, extract(config, keys))
	}

	// 写入命令行参数
	Object.assign(
		ctx.tsdownConfig,
		extract<CliOptions, keyof CliOptions>(cliOptions, [...keys, 'config'], {
			notValueWriteUndefined: false
		})
	)

	await actuator(ctx)
}

async function actuator(ctx: Ctx) {
	const tsdownConfig: TsdownOptions = ctx.tsdownConfig

	console.log('')
	console.log(conf.color(`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 开始构建...`), '\n')
	const startTimer = Date.now()

	try {
		await build(tsdownConfig)
		// 处理 package
		const packagePath = path.join(ctx.pwd, 'package.json')
		if (fs.existsSync(packagePath)) {
			const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
			content.main = './index.js'
			content.scripts = {
				start: 'node ./index.js'
			}
			delete content.devDependencies
			fs.writeFileSync(
				path.join(ctx.pwd, ctx.tsdownConfig.outDir, 'package.json'),
				JSON.stringify(content, null, 2),
				'utf8'
			)
		}

		// 打包结束事件
		if (ctx.bus.has('afterBuild')) ctx.bus.emit('afterBuild', ctx)
		if (ctx.bus.has('hook:afterBuild')) await ctx.bus.emitLineUp('hook:afterBuild', ctx)

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
		if (ctx.bus.has('error')) ctx.bus.emit('error', ctx, error)
		if (ctx.bus.has('hook:error')) await ctx.bus.emitLineUp('hook:error', ctx, error)
		console.log(conf.dangerColor(`${conf.errorEmoji} 构建失败，错误信息：`), '\n')
		throw error
	}
}
