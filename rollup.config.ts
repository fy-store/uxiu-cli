import type { RollupOptions } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { dts } from 'rollup-plugin-dts'
import { builtinModules } from 'node:module'

const config: RollupOptions[] = [
	{
		input: './src/index.ts',
		output: {
			file: './dist/index.js',
			format: 'es'
		},

		external: [...builtinModules, /node_modules/],

		// ignore error see https://github.com/rollup/plugins/issues/1662
		plugins: [
			// @ts-ignore error
			typescript(),
			nodeResolve({
				exportConditions: ['node']
			}),
			// @ts-ignore error
			commonjs(),
			// @ts-ignore error
			json()
		],
		onLog(_level, log) {
			if (log.id?.includes('node_modules') && log.id?.includes('depd')) {
				return
			}
			if (log.frame) {
				console.log(log.frame)
			}
		}
	},
	// 打包 d.ts
	{
		input: './src/index.ts',
		output: {
			file: './dist/index.d.ts',
			format: 'es'
		},

		plugins: [
			// @ts-ignore error
			typescript(),
			// @ts-ignore error
			commonjs(),
			// @ts-ignore error
			json(),
			dts()
		],
		external: [...builtinModules, /node_modules/],
		onLog(_level, log) {
			if (log.id?.includes('node_modules') && log.id?.includes('depd')) {
				return
			}
			if (log.frame) {
				console.log(log.frame)
			}
		}
	}
]

export default config
