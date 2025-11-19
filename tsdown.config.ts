import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: './src/index.ts',
	format: ['esm'],
	platform: 'node',
	exports: true,
	unbundle: true,
	nodeProtocol: true,
	fixedExtension: false
})
