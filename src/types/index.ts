export type * from '../utils/index.js'

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
