import type { Options as TsdownOptions } from 'tsdown'
import type Event from '@yishu/event'

export type DefaultOptions = {
	/** 配置文件运行根目录, 默认值为当前工作目录(process.cwd()) */
	pwd?: string
	/** 入口文件, 默认值为 './src/index.ts' */
	entry?: TsdownOptions['entry']
	/** 输出目录, 默认值为 './dist' */
	outDir?: TsdownOptions['outDir']
}

export type Ctx = {
	/** 配置文件运行根目录 */
	pwd: string
	/** cli 传入的选项 */
	cliOptions: CliOptions
	/** 配置文件传入的选项 */
	options: Options
	/** tsdown 打包参数 */
	tsdownConfig: tsdownConfig | null
	/** 事件总线 */
	bus: Event<BuildEvent>
}

export type BuildEvent = {
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

export type tsdownConfig = Required<DefaultOptions & CliOptions> & BaseOptions
