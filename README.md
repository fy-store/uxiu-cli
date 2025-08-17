# 安装 cli 工具

```bash
pnpm i -g uxiu-cli
# or
npm i -g uxiu-cli

# 使用以下方式临时运行
pnpx uxiu-cli
# or
npx uxiu-cli
```

## 命令使用

```bash
uxiu-cli [command] [options] [value]
# or 使用 = 传值 (help命令除外)
uxiu-cli [command] [options]=[value]
# 传递多个示例
uxiu-cli build -c=./dir1 -c=./file1
```

## 查看版本号

```bash
uxiu-cli -v
# or
uxiu-cli version
```

## 获取帮助

help 命令特殊, 不可使用 `=` 传值

```bash
uxiu-cli -h
# or
uxiu-cli help
# or 获取具体命令帮助
uxiu-cli -h [command]
```

## 创建项目

- name 别名 -n 项目名称

- root 别名 -r 创建项目的根路径, 默认为 `命令运行位置`

**示例**

```bash
uxiu-cli
# or
uxiu-cli create -n [name]
```

## 打包项目

- pwd 别名 -p 配置文件运行根目录, 默认为 `命令运行位置`

- entry 别名 -e 项目入口文件路径, 默认为 `./src/index.ts`

- outDir 别名 -o 打包输出路径, 默认为 `./dist`

- format 别名 -f 输出格式 默认为 `esm`

- platform 别名 -pl 运行平台, 默认值为 `node`

- unbundle 别名 -ub 不拆包, 默认为 `true`

- nodeProtocol 别名 -np node 内置模块添加 `node:` 前缀, 默认为 `true`

- config 别名 -c 打包配置文件路径, 默认为 `./uxiu-cli.config.ts`

**示例**

```bash
uxiu-cli build
```

## 打包配置文件

默认读取 `./uxiu-cli.config.ts`

**示例 1**

```ts
// 借助 defineBuild() 函数获取类型提示
import { defineBuild } from 'uxiu-cli'

export default defineBuild({
	// 书写配置
})
```

- tsdownOptions tsdown 选项, 该选项将覆盖 uxiu-cli 选项

- event 事件

  - beforeBuild 打包前事件, 仅配置文件支持

  - hook:beforeBuild 打包前钩子函数(若返回 Promise 将进行等待), 仅配置文件支持

  - afterBuild 打包后事件, 仅配置文件支持

  - hook:afterBuild 打包后钩子函数(若返回 Promise 将进行等待), 仅配置文件支持

  - error 打包错误事件, 仅配置文件支持

  - hook:error 打包错误事件钩子函数(若返回 Promise 将进行等待), 仅配置文件支持

**示例 2**

```ts
// 借助 configToJSON5() 将代码配置转为静态 json5 配置
import { configToJSON5 } from 'uxiu-cli'

const json5Text = await configToJSON5(path)
```

- path code 文件绝对路径

**示例 3**

```ts
// 使用 tsdown
import { tsdown } from 'uxiu-cli'

tsdown.build // tsdown 包
```
