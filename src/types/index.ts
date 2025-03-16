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

export interface UxiuConfig {
	/**
	 * 输入路径, 该配置将直接传递给 rollup 的 input
	 * - cli 命令参数将覆盖此参数
	 * - 默认值为 `./src/index.ts`
	 */
	input?: string | string[] | Record<string, string>
	/**
	 * 输出目录, 该配置将传递给 rollup 的 output.dir
	 * - cli 命令参数将覆盖此参数
	 * - 默认值为 `./dist`
	 */
	output?: string
	/**
	 * 源码地图, 该配置将传递给 rollup 的 output.sourcemap
	 * - cli 命令参数将覆盖此参数
	 * - 默认值为 `false`
	 */
	sourcemap?: boolean | 'inline' | 'hidden'
	/**
	 * 复制, 该配置若是一个字符串或字符串数组则 cli 工具将按照指定路径进行复制, 若为函数则 cli 将进行调用(返回 promise 将进行等待)
	 * - cli 命令参数将覆盖此参数
	 */
	copy?: string | string[] | Function
	/**
	 * tsconfig 配置文件路径
	 * - cli 命令参数将覆盖此参数
	 * - 默认为 `./tsconfig.json`
	 */
	tsconfig?: string | false
	/**
	 * 打包前钩子函数(返回 promise 将进行等待)
	 */
	beforeBuild?: Function
	/**
	 * 打包后钩子函数(返回 promise 将进行等待)
	 */
	afterBuild?: Function
}

export interface BuildParams {
	root: string
	input: string | string[] | Record<string, string>
	output: string
	sourcemap: boolean | 'inline' | 'hidden'
	copy?: string | string[] | Function
	tsconfig?: string | false
	afterBuild?: Function
}
