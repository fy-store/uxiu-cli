import { describe, expect, it } from 'vitest'
import { defineBuild } from '../src/utils/defineBuild/index.js'

describe('defineBuild', () => {
	it('原样返回配置对象，便于保留类型推断', () => {
		const options = {
			entry: './src/server.ts',
			outDir: './output',
			format: ['esm', 'cjs'] as Array<'esm' | 'cjs'>,
			unbundle: false
		}

		expect(defineBuild(options)).toBe(options)
	})
})
