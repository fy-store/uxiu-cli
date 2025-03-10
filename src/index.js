#!/usr/bin/env node
import Path from 'path/posix'
import fs from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { input, select } from '@inquirer/prompts'
import { conf } from './conf.js'

const root = process.cwd()
if (process.argv.length === 2) {
	process.argv.push('create')
}

yargs(hideBin(process.argv))
	.command(
		'create [name]',
		'创建项目',
		async (yargs) => {
			yargs.positional('name', {
				describe: '项目名称',
				type: 'string'
			})
		},
		async (args) => {
			let name = args.name
			let template
			try {
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
					const fullPath = Path.join(root, value)
					if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
						console.log('')
						console.log(conf.dangerColor(`${conf.errorEmoji} "${value}" 文件夹已存在，请更换名称或移除`), '\n')
					} else {
						name = value
					}
				}

				console.log('')
				template = await select({
					message: '请选择模板',
					choices: [
						{ name: '标准模板', value: 'default' }
						// { name: '预设: mysql(raw) + log4js', value: 'rawMysqlAndLog4js' }
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
			} catch (error) {
				if (error instanceof Error && error.name === 'ExitPromptError') {
					console.log(`\n${conf.byeEmoji} 下次再见 !`, '\n')
					process.exit(0)
				} else {
					throw error
				}
			}

			const { create } = await import('./create.js')
			await create({ root, name, template })
		}
	)
	.command(
		'build [entry] [output] [public] [copy]',
		'打包项目',
		(yargs) => {
			yargs.positional('entry', {
				describe: '入口',
				alias: 'e',
				default: './src/index.ts'
			})

			yargs.positional('output', {
				describe: '出口',
				alias: 'o',
				default: './dist'
			})

			yargs.positional('public', {
				describe: '静态资源',
				alias: 'p',
				default: ['./public'],
				type: Array
			})
		},
		async (args) => {
			const { entry, output } = args
			const entryPath = Path.join(root, entry)
			const outputPath = Path.join(root, output)
			if (!fs.existsSync(entryPath)) {
				throw new Error(conf.dangerColor(`入口文件不存在: ${entryPath}`))
			}
			const { build } = await import('./build.js')
			const pub = Array.isArray(args.public) ? args.public : [args.public]
			await build({ root, input: entryPath, output: outputPath, public: pub })
		}
	)
	.command('version', '显示版本号', (yargs) => {
		yargs.showVersion('log')
	})
	.alias('v', 'version')
	.locale('zh_CN')
	.strict()
	.version('0.5.1')
	.help()
	.scriptName('uxiu-cli')
	.parse()
