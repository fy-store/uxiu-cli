export type * from '../utils/index.js'
export * from '../build/types.js'
export type * as TsdownType from 'tsdown'
export type { Options as TsdownOptions } from 'tsdown'

export interface CreateOptions {
	n?: string
	name?: string
	r: string
	root: string
}

export interface CreateParams {
	root: string
	name: string
	templateId: string
	projectPath: string
}

export interface GetResourceOptions {
	root: string
	name: string
	templateId: string
}
