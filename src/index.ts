#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import * as Create from './create/index.js'
import * as Build from './build/index.js'
import type { UxiuConfig } from './types/index.js'
// @ts-ignore
import { version } from '../package.json'

if (process.argv.length === 2) {
	process.argv.push('create')
}

yargs(hideBin(process.argv))
	.command(Create.command, Create.describe, Create.commandHandle, Create.execute)
	.command(Build.command, Build.describe, Build.commandHandle, Build.execute)
	.command('version', '显示版本号', (yargs) => {
		yargs.showVersion('log')
	})
	.alias('v', 'version')
	.alias('h', 'help')
	.locale('zh_CN')
	.strict()
	.version(version)
	.help()
	.scriptName('uxiu-cli')
	.parse()

export function defindBuild(config: UxiuConfig) {
	return config
}
