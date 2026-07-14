import fs from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchSourceMock, inputMock, selectMock } = vi.hoisted(() => ({
	fetchSourceMock: vi.fn(),
	inputMock: vi.fn(),
	selectMock: vi.fn()
}))

vi.mock('@inquirer/prompts', () => ({ input: inputMock, select: selectMock }))
vi.mock('../src/utils/fetchSource/index.js', async (importOriginal) => {
	const original = await importOriginal<typeof import('../src/utils/fetchSource/index.js')>()
	return { ...original, default: fetchSourceMock }
})

import { execute } from '../src/create/index.js'

describe('create execute', () => {
	const tempDirectories: string[] = []
	const originalCwd = process.cwd()

	async function makeTempDirectory() {
		const directory = await fs.promises.mkdtemp(path.join(originalCwd, 'tests', '.create-'))
		tempDirectories.push(directory)
		return directory
	}

	beforeEach(() => {
		fetchSourceMock.mockReset()
		inputMock.mockReset()
		selectMock.mockReset()
		vi.spyOn(console, 'log').mockImplementation(() => undefined)
	})

	afterEach(async () => {
		process.chdir(originalCwd)
		vi.restoreAllMocks()
		await Promise.all(tempDirectories.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true, force: true })))
	})

	it('目标目录已经存在时停止创建', async () => {
		const root = await makeTempDirectory()
		await fs.promises.mkdir(path.join(root, 'existing-project'))

		await execute({ root, name: 'existing-project' } as never)

		expect(selectMock).not.toHaveBeenCalled()
		expect(fetchSourceMock).not.toHaveBeenCalled()
	})

	it('下载并解压模板，同时重写项目 package.json', async () => {
		const root = await makeTempDirectory()
		const archive = new AdmZip()
		archive.addFile(
			'uxiu-template-default-master/package.json',
			Buffer.from(JSON.stringify({ name: 'template-name', version: '9.9.9', scripts: { dev: 'tsx src/index.ts' } }))
		)
		archive.addFile('uxiu-template-default-master/src/index.ts', Buffer.from("console.log('hello')\n"))
		archive.addFile('uxiu-template-default-master/README.md', Buffer.from('# Template\n'))
		fetchSourceMock.mockResolvedValue({ data: archive.toBuffer() })
		selectMock.mockResolvedValue('default')
		process.chdir(root)

		await execute({ root, name: 'demo-project' } as never)

		expect(fetchSourceMock).toHaveBeenCalledWith(
			'https://github.com/fy-store/uxiu-template-default/archive/refs/heads/master.zip',
			{ timeout: 15000, retries: 3, responseType: 'arraybuffer' }
		)
		const projectPackage = JSON.parse(
			await fs.promises.readFile(path.join(root, 'demo-project', 'package.json'), 'utf8')
		)
		expect(projectPackage).toEqual({
			name: 'demo-project',
			version: '0.0.0',
			scripts: { dev: 'tsx src/index.ts' }
		})
		await expect(fs.promises.readFile(path.join(root, 'demo-project', 'src', 'index.ts'), 'utf8')).resolves.toBe(
			"console.log('hello')\n"
		)
	})

	it('未提供名称时持续询问，直到获得未占用的项目名称', async () => {
		const root = await makeTempDirectory()
		await fs.promises.mkdir(path.join(root, 'occupied'))
		const archive = new AdmZip()
		archive.addFile('uxiu-template-default-master/README.md', Buffer.from('# New project\n'))
		inputMock.mockResolvedValueOnce('occupied').mockResolvedValueOnce('available')
		selectMock.mockResolvedValue('default')
		fetchSourceMock.mockResolvedValue({ data: archive.toBuffer() })
		process.chdir(root)

		await execute({ root } as never)

		expect(inputMock).toHaveBeenCalledTimes(2)
		await expect(fs.promises.readFile(path.join(root, 'available', 'README.md'), 'utf8')).resolves.toBe('# New project\n')
	})
})
