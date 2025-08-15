# 安装 cli 工具

```bash
pnpm i -g uxiu-cli
# or
npm i -g uxiu-cli

# 如果你不想全局安装, 可以使用以下方式临时运行
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

- input 别名 -i 项目入口路径, 默认为 ./src/index.ts

  - 支持 string | string[] | Record<string, string>

  - 具体可参考 https://www.rollupjs.com/configuration-options/#input

- output 别名 -o 项目输出路径, 默认为 `./dist`

- copy 别名 -c 复制文件路径, 若配置, 打包将原封不动的复制

  - 支持 string | string[] | function

  - function 仅配置文件支持(返回 promise 将进行等待)

- root 别名 -r 打包项目的根路径, 默认为 `命令运行位置`

- sourcemap 别名 -s 打包结果是否包含 sourcemap, 默认为 `false`

- tsconfig 别名 -t tsconfig 路径, 默认为 `./tsconfig.json`

- config 别名 -c 打包配置文件路径, 默认为 `./uxiu-cli.config.ts`

- beforeBuild 打包前钩子函数, 仅配置文件支持(返回 promise 将进行等待)

- afterBuild 打包后钩子函数, 仅配置文件支持(返回 promise 将进行等待)

**示例**

```bash
uxiu-cli build
```

## 打包配置文件

若 `build` 命令未配置 `config` 则在对应项目根目录中创建 `uxiu-cli.config.ts` 文件

若 `build` 命令已配置 `config` 则按照实际命令进行创建 `.ts` 或 `.js` 文件

**示例 1**

```ts
// 借助 defindBuild() 函数获取类型提示
import { defindBuild } from 'uxiu-cli'

export default defindBuild({
	// 书写配置
})
```

**示例 2**

```ts
// 借助 configToJSON5() 将代码配置转为静态 json5 配置
import { configToJSON5 } from 'uxiu-cli'

const json5Text = await configToJSON5(path)
```

- path code 文件绝对路径
