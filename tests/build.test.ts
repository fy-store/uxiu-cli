import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { buildMock } = vi.hoisted(() => ({ buildMock: vi.fn() }))

vi.mock('tsdown', () => ({ build: buildMock }))

import { execute } from '../src/build/index.js'

describe('build execute', () => {
	const tempDirectories: string[] = []

	async function makeTempDirectory() {
		await fs.promises.mkdir(path.join(process.cwd(), 'tests'), { recursive: true })
		const directory = await fs.promises.mkdtemp(path.join(process.cwd(), 'tests', '.build-'))
		tempDirectories.push(directory)
		return directory
	}

	beforeEach(() => {
		buildMock.mockReset().mockResolvedValue(undefined)
		vi.spyOn(console, 'log').mockImplementation(() => undefined)
	})

	afterEach(async () => {
		vi.restoreAllMocks()
		await Promise.all(tempDirectories.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true, force: true })))
		delete (globalThis as Record<string, unknown>).__uxiuBuildEvents
	})

	it('没有配置文件时使用默认构建选项', async () => {
		const pwd = await makeTempDirectory()

		await execute({ pwd, config: './missing.config.mjs' } as never)

		expect(buildMock).toHaveBeenCalledOnce()
		expect(buildMock).toHaveBeenCalledWith({
			pwd,
			entry: {
				'src/index': './src/'
			},
			outDir: './dist',
			format: 'esm',
			platform: 'node',
			unbundle: true,
			nodeProtocol: true,
			fixedExtension: false
		})
	})

	it('按默认值、配置文件、命令行、tsdownOptions 的顺序合并选项并执行钩子', async () => {
		const pwd = await makeTempDirectory()
		await fs.promises.writeFile(
			path.join(pwd, 'uxiu-cli.config.mjs'),
			`export default {
				entry: './src/from-config.ts',
				outDir: './output',
				platform: 'browser',
				tsdownOptions: { minify: true, platform: 'neutral' },
				event: {
					beforeBuild() { globalThis.__uxiuBuildEvents = ['beforeBuild'] },
					async 'hook:beforeBuild'() { globalThis.__uxiuBuildEvents.push('hook:beforeBuild') },
					afterBuild() { globalThis.__uxiuBuildEvents.push('afterBuild') },
					async 'hook:afterBuild'() { globalThis.__uxiuBuildEvents.push('hook:afterBuild') }
				}
			}`,
			'utf8'
		)

		await execute({
			pwd,
			config: './uxiu-cli.config.mjs',
			entry: './src/from-cli.ts',
			platform: 'node'
		} as never)

		expect(buildMock).toHaveBeenCalledWith(
			expect.objectContaining({
				pwd,
				entry: './src/from-cli.ts',
				outDir: './output',
				platform: 'neutral',
				minify: true
			})
		)
		expect((globalThis as Record<string, unknown>).__uxiuBuildEvents).toEqual([
			'beforeBuild',
			'hook:beforeBuild',
			'afterBuild',
			'hook:afterBuild'
		])
	})

	it('构建完成后生成可部署的 package.json', async () => {
		const pwd = await makeTempDirectory()
		await fs.promises.writeFile(
			path.join(pwd, 'package.json'),
			JSON.stringify({
				name: 'demo-service',
				version: '1.2.3',
				scripts: { dev: 'tsx src/index.ts' },
				dependencies: { koa: '^3.0.0' },
				devDependencies: { tsx: '^4.0.0' }
			}),
			'utf8'
		)
		buildMock.mockImplementation(async (options: { pwd: string; outDir: string }) => {
			await fs.promises.mkdir(path.join(options.pwd, options.outDir), { recursive: true })
		})

		await execute({ pwd, config: './missing.config.mjs' } as never)

		const outputPackage = JSON.parse(await fs.promises.readFile(path.join(pwd, 'dist', 'package.json'), 'utf8'))
		expect(outputPackage).toEqual({
			name: 'demo-service',
			version: '1.2.3',
			scripts: { start: 'node ./src/index.js' },
			dependencies: { koa: '^3.0.0' },
			main: './src/index.js'
		})
	})

	it('构建失败时依次触发错误事件与异步错误钩子', async () => {
		const pwd = await makeTempDirectory()
		await fs.promises.writeFile(
			path.join(pwd, 'uxiu-cli.config.mjs'),
			`export default {
				event: {
					error(_ctx, error) { globalThis.__uxiuBuildEvents = ['error:' + error.message] },
					async 'hook:error'(_ctx, error) { globalThis.__uxiuBuildEvents.push('hook:error:' + error.message) }
				}
			}`,
			'utf8'
		)
		buildMock.mockRejectedValue(new Error('build exploded'))

		await expect(execute({ pwd, config: './uxiu-cli.config.mjs' } as never)).rejects.toThrow('build exploded')
		expect((globalThis as Record<string, unknown>).__uxiuBuildEvents).toEqual([
			'error:build exploded',
			'hook:error:build exploded'
		])
	})
})
