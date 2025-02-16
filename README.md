# 安装脚手架

```bash
pnpm i -g uxiu-cli
# or
npm i -g uxiu-cli
# 非全局安装你需要手动在项目中安装 uxiu-cli 为开发依赖以确保可以打包
pnpx uxiu-cli
# or
npx uxiu-cli
```

## 创建项目

```bash
uxiu
# or
uxiu create [name]
```

## 打包项目

- entry 别名 -e 入口文件路径, 默认为 ./src/index.ts
- output 别名 -o 出口目录路径, 默认为 ./dist
- public 别名 -p 静态资源路径, 若配置, 打包将原封不动的复制

```bash
uxiu build
# or
uxiu build entry=[entry] output=[output] public=[public]
```
