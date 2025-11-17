import type { Options as TsdownOptions } from 'tsdown'
import type { Bus } from 'event-imt'

export type DefaultOptions = {
	/** 配置文件运行根目录, 默认值为当前工作目录(process.cwd()) */
	pwd?: string
	/** 入口文件, 默认值为 './src/index.ts' */
	entry?: TsdownOptions['entry']
	/** 输出目录, 默认值为 './dist' */
	outDir?: TsdownOptions['outDir']
	/** 输出格式, 默认值为 'esm' */
	format?: TsdownOptions['format']
	/** 运行平台, 默认值为 'node' */
	platform?: TsdownOptions['platform']
	/** 不拆包, 默认为 true */
	unbundle?: TsdownOptions['unbundle']
	/** node 内置模块添加 node: 前缀, 默认为 true */
	nodeProtocol?: TsdownOptions['nodeProtocol']
}

export type Ctx = {
	/** 配置文件运行根目录 */
	pwd: string
	/** cli 传入的选项 */
	cliOptions: CliOptions
	/** 配置文件传入的选项 */
	options: Options | null
	/** tsdown 打包参数 */
	tsdownConfig: TsdownConfig
	/** 事件总线 */
	bus: Bus<BuildEvent>
}

export interface BuildEvent {
	/** 打包前事件 */
	beforeBuild?: (ctx: Ctx) => void
	/** 打包前钩子函数, 返回 Promise 将进行等待 */
	'hook:beforeBuild'?: (ctx: Ctx) => Promise<void> | void
	/** 打包后事件 */
	afterBuild?: (ctx: Ctx) => void
	/** 打包后钩子函数, 返回 Promise 将进行等待 */
	'hook:afterBuild'?: (ctx: Ctx) => Promise<void> | void
	/** 打包错误事件 */
	error?: (ctx: Ctx, error: any) => void
	/** 打包错误钩子函数, 返回 Promise 将进行等待 */
	'hook:error'?: (ctx: Ctx, error: any) => Promise<void> | void
	[k: symbol]: (...args: any[]) => any
}

type BaseOptions = {
	/** 事件和钩子函数 */
	event?: BuildEvent
	/** tsdown 选项, 该选项将覆盖 uxiu-cli 选项 */
	tsdownOptions?: TsdownOptions
}

export type Options = DefaultOptions & BaseOptions

export type CliOptions = {
	/** uxiu-cli 配置文件路径 */
	config?: string
} & DefaultOptions

export type TsdownConfig = Required<DefaultOptions & CliOptions> & BaseOptions
