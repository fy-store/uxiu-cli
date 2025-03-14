# 安装 cli 工具

```bash
pnpm i -g uxiu-cli
# or
npm i -g uxiu-cli

# 如果你不想用 全局安装, 可以使用
pnpx uxiu-cli
# or
npx uxiu-cli
```

## 创建项目

```bash
uxiu-cli
# or
uxiu-cli create [name]
```

## 打包项目

- entry 别名 -e 入口文件路径, 默认为 ./src/index.ts
- output 别名 -o 出口目录路径, 默认为 ./dist
- public 别名 -p 静态资源路径, 若配置, 打包将原封不动的复制

  - 支持多项: `uxiu-cli -p ./public1 ./public2 ./public3/index.yaml ...`

```bash
uxiu-cli build
# or
uxiu-cli build entry=[entry] output=[output] public=[public]
```
