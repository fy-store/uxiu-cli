import type * as Ts from 'typescript'
import { pathToFileURL } from 'url'

/**
 * 将配置转换为 JSON5 格式
 * - 配置支持 .js / .ts , 文件中需要提供一个 default 导出, 且导出的内容必须是一个可 JSON 序列化的对象
 * @param fullPath 文件的绝对路径
 */
export async function configToJSON5(fullPath: string): Promise<string> {
	const { default: c } = await import(pathToFileURL(fullPath).href)
	const { default: ts } = await import('typescript')
	const config = JSON.parse(JSON.stringify(c))

	// 提取源文件注释 (JSDoc 与普通注释)
	type CommentInfo = { raw: string; isJsDoc: boolean }
	let docMap: Record<string, CommentInfo> = {}
	const program = ts.createProgram([fullPath], { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext })
	const source = program.getSourceFile(fullPath)

	if (source) {
		/** 获取节点文本内容 */
		const safeGetText = (node: Ts.Node) => {
			try {
				return node.getText()
			} catch {
				return ''
			}
		}

		/** 获取属性名 */
		const getPropName = (nameNode: Ts.PropertyName): string => {
			if (ts.isIdentifier(nameNode)) return nameNode.text
			if (ts.isStringLiteral(nameNode) || ts.isNoSubstitutionTemplateLiteral(nameNode) || ts.isNumericLiteral(nameNode))
				return nameNode.text
			if (ts.isComputedPropertyName(nameNode)) return safeGetText(nameNode.expression)
			return safeGetText(nameNode)
		}

		/** 收集节点的注释信息 */
		const collectComment = (node: Ts.Node): CommentInfo | undefined => {
			const fullText = source.getFullText()
			const ranges = ts.getLeadingCommentRanges(fullText, node.getFullStart())
			if (!ranges || !ranges.length) return undefined
			const last = ranges[ranges.length - 1]
			const raw = fullText.slice(last.pos, last.end)
			const trimmed = raw.trim()
			if (trimmed.startsWith('/**')) {
				return { raw: trimmed, isJsDoc: true }
			} else if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
				return { raw: trimmed, isJsDoc: false }
			}
			return undefined
		}

		/** 遍历源文件所有子节点 */
		source.forEachChild((node) => {
			if (ts.isExportAssignment(node)) {
				const expr = node.expression
				if (ts.isIdentifier(expr)) {
					// export default 追溯定义对象
					const name = expr.text
					source.forEachChild((n2) => {
						if (ts.isVariableStatement(n2)) {
							n2.declarationList.declarations.forEach((decl) => {
								if (
									ts.isIdentifier(decl.name) &&
									decl.name.text === name &&
									decl.initializer &&
									ts.isCallExpression(decl.initializer)
								) {
									const arg = decl.initializer.arguments[0]
									if (arg && ts.isObjectLiteralExpression(arg)) {
										arg.properties.forEach((p) => {
											if (ts.isPropertyAssignment(p)) {
												const key = getPropName(p.name)
												const c = collectComment(p)
												if (c) docMap[key] = c
											}
										})
									}
								}
							})
						}
					})
				} else if (ts.isObjectLiteralExpression(expr)) {
					expr.properties.forEach((p) => {
						if (ts.isPropertyAssignment(p)) {
							const key = getPropName(p.name)
							const c = collectComment(p)
							if (c) docMap[key] = c
						}
					})
				}
			}
		})
	}

	const INDENT = '    '
	const isIdent = (k: string) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k)
	const quoteKey = (k: string) => (isIdent(k) ? k : JSON.stringify(k))
	const serializeValue = (v: any, indent: number): string => {
		if (typeof v === 'string') return JSON.stringify(v)
		if (typeof v === 'number' || typeof v === 'boolean') return String(v)
		if (typeof v === 'bigint') return v.toString() + 'n'
		if (v === null) return 'null'
		if (Array.isArray(v)) {
			if (!v.length) return '[]'
			return '[ ' + v.map((x) => serializeValue(x, indent)).join(', ') + ' ]'
		}
		if (typeof v === 'object') {
			const keys = Object.keys(v)
			if (!keys.length) return '{}'
			const pad = ' '.repeat(indent)
			const inner = keys
				.map((k, i) => {
					const line = `${pad}${INDENT}${quoteKey(k)}: ${serializeValue(v[k], indent + INDENT.length)}`
					return i < keys.length - 1 ? line + ',' : line
				})
				.join('\n')
			return `{/n${inner}\n${pad}}`.replace('{/n', '{\n')
		}
		return JSON.stringify(v)
	}

	const lines: string[] = []
	Object.keys(config).forEach((k) => {
		const v = config[k]
		const c = docMap[k]
		if (c) {
			if (c.isJsDoc) {
				const jsdoc = c.raw
					.split('\n')
					.map((ln) => INDENT + ln)
					.join('\n')
				lines.push(jsdoc)
			} else {
				c.raw.split('\n').forEach((ln) => lines.push(INDENT + ln))
			}
		}
		lines.push(`${INDENT}${quoteKey(k)}: ${serializeValue(v, INDENT.length)},`)
	})

	// 去掉最后一个属性行末尾逗号
	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i]
		if (/^\s*\/\//.test(line) || /^\s*\/\*/.test(line) || !line.trim()) continue // 跳过注释行
		if (line.trim().endsWith(',')) {
			lines[i] = line.replace(/,+\s*$/, '')
		}
		break
	}

	return `{\n${lines.join('\n')}\n}`
}
