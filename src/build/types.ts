import type { Options as TsdownOptions } from 'tsdown'
import type Event from '@yishu/event'

export type DefaultOptions = {
	/** 配置文件运行根目录, 默认值为当前工作目录(process.cwd()) */
	pwd?: string
	/** 入口文件, 默认值为 './src/index.ts' */
	entry?: string
	/** 输出目录, 默认值为 './dist' */
	outDir?: string
}

export type BuildEvent = {
	/** 打包前事件 */
	beforeBuild?: () => void
	/** 打包前钩子函数, 返回 Promise 将进行等待 */
	'hook:beforeBuild'?: () => Promise<void> | void
	/** 打包后事件 */
	afterBuild?: () => void
	/** 打包后钩子函数, 返回 Promise 将进行等待 */
	'hook:afterBuild'?: () => Promise<void> | void
	/** 打包错误事件 */
	error?: (error: any) => void
	/** 打包错误钩子函数, 返回 Promise 将进行等待 */
	'hook:error'?: (error: any) => Promise<void> | void
}

type BaseOptions = {
	/** 事件和钩子函数 */
	event?: BuildEvent
	/** tsdown 选项, 该选项将覆盖 uxiu-cli 选项 */
	tsdownOptions?: TsdownOptions
}

export type Options = DefaultOptions & BaseOptions

export type CliOptions = {
	config?: string
} & DefaultOptions

export type Params = Required<DefaultOptions & CliOptions> &
	BaseOptions & {
		bus: Event<BuildEvent>
	}
