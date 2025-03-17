import type { ArgumentsCamelCase, Argv } from 'yargs'
import fs from 'fs'
import path from 'path/posix'
import { rollup, RollupBuild } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import { builtinModules } from 'module'
import dayjs from 'dayjs'
import conf from '../conf/index.js'
import { extract, isArray, isFunction, isString } from 'uxiu'
import { pathToFileURL } from 'url'
import { BuildParams, UxiuConfig } from '@/types/index.js'
import 'tsx/esm' // 用于载入配置文件, 不使用 tsImport() , 防止触发循环

const root = process.cwd()

export const command = 'build [input] [output] [copy] [sourcemap] [root] [tsconfig] [config]'

export const describe = '打包项目'

interface BuildOptions {
	r: string
	root: string
	i?: string | string[] | Record<string, string>
	input?: string | string[] | Record<string, string>
	o?: string
	output?: string
	cp?: string | string[]
	copy?: string | string[]
	s?: boolean | 'inline' | 'hidden'
	sourcemap?: boolean | 'inline' | 'hidden'
	t?: string
	tsconfig?: string
	c: string
	config: string
}

export async function commandHandle(yargs: Argv<BuildOptions | Record<string, any>>) {
	yargs
		.option('root', {
			desc: '项目根目录, 通过该选项指定打包项目的根(绝对路径)',
			type: 'string',
			alias: 'r',
			default: root
		})
		.option('input', {
			alias: 'i',
			desc: '项目入口路径',
			type: 'array'
		})
		.option('output', {
			alias: 'o',
			desc: '项目输出路径',
			type: 'string'
		})
		.option('copy', {
			alias: 'cp',
			desc: '复制文件路径',
			type: 'array'
		})
		.option('sourcemap', {
			alias: 's',
			desc: '打包结果是否包含 sourcemap',
			type: 'boolean'
		})
		.option('tsconfig', {
			alias: 't',
			desc: 'tsconfig 路径',
			type: 'string'
		})
		.option('config', {
			alias: 'c',
			desc: 'uxiu-cli 配置路径',
			type: 'string',
			default: './uxiu-cli.config.ts'
		})
}

export async function execute(options: ArgumentsCamelCase<BuildOptions>) {
	const params: BuildParams = {
		root: options.root,
		input: './src/index.ts',
		output: './dist',
		sourcemap: false,
		tsconfig: './tsconfig.json'
	}

	const fullPath = path.join(options.root, options.config)
	if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
		// 载入配置文件
		const c = await import(pathToFileURL(fullPath).href)

		const uxiuConfig = c.default as UxiuConfig
		if (uxiuConfig.beforeBuild) {
			await uxiuConfig.beforeBuild()
		}

		Object.assign(
			params,
			extract(uxiuConfig, ['input', 'output', 'sourcemap', 'copy', 'tsconfig', 'afterBuild'], {
				notValueWriteUndefined: false
			})
		)
	}

	// 写入命令行参数
	Object.assign(
		params,
		extract<BuildOptions, keyof BuildOptions>(options, ['input', 'output', 'sourcemap', 'copy', 'tsconfig'], {
			notValueWriteUndefined: false
		})
	)

	await actuator(params)
}

async function actuator(params: BuildParams) {
	const { root, sourcemap, copy, tsconfig, afterBuild } = params
	const input = (function () {
		if (isString(params.input)) {
			return path.join(root, params.input)
		}

		if (isArray(params.input)) {
			return params.input.map((p) => path.join(root, p))
		}

		return Object.fromEntries(
			Object.entries(params.input).map(([k, p]) => {
				return [k, path.join(root, p)]
			})
		)
	})()

	const output = path.join(root, params.output)

	console.log('')
	console.log(conf.color(`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 开始构建...`), '\n')
	const startTimer = Date.now()

	// 输出目录如果存在则进行删除
	if (fs.existsSync(output)) {
		await fs.promises.rm(output, { recursive: true })
	}

	let bundle: RollupBuild | undefined
	let buildFailed = false
	try {
		// ignore error see https://github.com/rollup/plugins/issues/1662
		bundle = await rollup({
			input,
			plugins: [
				// @ts-ignore
				json(),
				// @ts-ignore
				resolve({
					rootDir: root
				}),
				// @ts-ignore
				commonjs(),
				// @ts-ignore
				typescript({
					// rootDir: root,
					// baseUrl: root,
					// allowSyntheticDefaultImports: true,
					tsconfig: isString(tsconfig) ? path.join(root, tsconfig) : tsconfig
				})
			],
			external: [...builtinModules, /node_modules/]
		})

		// 输出打包结果
		await bundle.write({
			dir: output,
			sourcemap: sourcemap,
			format: 'es'
		})

		// 处理 package
		const packagePath = path.join(root, 'package.json')
		if (fs.existsSync(packagePath)) {
			const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
			content.main = './index.js'
			content.scripts = {
				start: 'node ./index.js'
			}
			delete content.devDependencies
			fs.writeFileSync(path.join(output, 'package.json'), JSON.stringify(content, null, 2), 'utf8')
		}

		// 处理 copy 配置
		if (isString(copy)) {
			const copyPath = path.join(root, copy)
			const target = path.join(output, copy)
			if (fs.existsSync(copyPath)) {
				await fs.promises.cp(copyPath, target, { recursive: true })
			}
		} else if (isArray(copy)) {
			await Promise.all(
				copy.map((p) => {
					const copyPath = path.join(root, p)
					const target = path.join(output, p)
					if (fs.existsSync(copyPath)) {
						return fs.promises.cp(copyPath, target, { recursive: true })
					}
				})
			)
		} else if (isFunction(copy)) {
			await copy()
		}

		// 打包结束钩子
		if (afterBuild) {
			await afterBuild()
		}

		console.log(
			conf.color(
				`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 构建完成，耗时 ${
					(Date.now() - startTimer) / 1000
				} 秒`
			),
			'\n'
		)
	} catch (error) {
		buildFailed = true
		console.log(conf.dangerColor(`${conf.errorEmoji} 构建失败，错误信息：`), error, '\n')
	}

	if (bundle) {
		await bundle.close()
	}
	process.exit(buildFailed ? 1 : 0)
}
