# 安装脚手架

```bash
pnpm i -g uxiu-cli
# or
npm i -g uxiu-cli
```

## 创建项目

```bash
uxiu
# or
uxiu create [name]
```

## 打包项目

- entry 入口文件路径, 默认为 ./src/index.ts
- output 出口目录路径, 默认为 ./dist

```bash
uxiu build
# or
uxiu build entry=[entry] output=[output]
```