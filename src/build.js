import fs from 'fs'
import Path from 'path/posix'
import { rollup } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import { builtinModules } from 'module'
import dayjs from 'dayjs'
import { conf } from './conf.js'

/**
 * @param {import('./types/index.ts').BuildOptions} options
 */
export const build = async (options) => {
	console.log('')
	console.log(conf.color(`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 开始构建...`))
	console.log('')
	const startTimer = Date.now()
	if (fs.existsSync(options.output)) {
		await fs.promises.rm(options.output, { recursive: true })
	}

	let bundle
	let buildFailed = false
	try {
		bundle = await rollup({
			input: options.input,
			plugins: [
				resolve(),
				commonjs(),
				typescript({ baseUrl: options.root, allowSyntheticDefaultImports: true }),
				json()
			],
			external: [...builtinModules, /node_modules/]
		})

		await bundle.write({
			dir: options.output,
			format: 'es',
			sourcemap: true
		})

		const packagePath = Path.join(options.root, 'package.json')
		if (fs.existsSync(Path.join(options.root, 'package.json'))) {
			const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
			content.main = './index.js'
			content.scripts = {
				start: 'node ./index.js'
			}
			delete content.devDependencies
			fs.writeFileSync(Path.join(options.output, 'package.json'), JSON.stringify(content, null, 2), 'utf8')
		}

		const publicPath = Path.join(options.root, options.public)
		if (fs.existsSync(publicPath)) {
			fs.cpSync(publicPath, Path.join(options.output, options.public), { recursive: true })
		}

		console.log(
			conf.color(`${conf.successEmoji} ${dayjs().format('YYYY/MM/DD HH:mm:ss')}: 构建完成，耗时 ${(Date.now() - startTimer) / 1000} 秒`)
		)
		console.log('')
	} catch (error) {
		buildFailed = true
		console.log(conf.dangerColor(`${conf.errorEmoji}构建失败，错误信息：`), error)
		console.log('')
	}

	if (bundle) {
		await bundle.close()
	}
	process.exit(buildFailed ? 1 : 0)
}
