import { styleText } from 'node:util'

export const config = {
	templates: {
		default: {
			name: '默认模板',
			replaceName: 'uxiu-template-default-master',
			list: [
				{
					origin: 'github',
					host: 'github.com',
					store: 'fy-store/uxiu-template-default/archive/refs/heads',
					ref: 'master'
				}
			]
		},
		'monorepo-vue3-raw-sql': {
			name: 'monorepo: vue3 + nodejs + raw-sql 模板',
			replaceName: 'uxiu-template-monorepo-vue3-raw-sql-master',
			list: [
				{
					origin: 'github',
					host: 'github.com',
					store: 'fy-store/uxiu-template-monorepo-vue3-raw-sql/archive/refs/heads',
					ref: 'master'
				}
			]
		}
	},

	urls: {
		default: 'https://github.com/fy-store/uxiu-template-default/archive/refs/heads/master.zip',
		'monorepo-vue3-raw-sql':
			'https://github.com/fy-store/uxiu-template-monorepo-vue3-raw-sql/archive/refs/heads/master.zip'
	},
	replaceStrs: {
		default: 'uxiu-template-default-master/',
		'monorepo-vue3-raw-sql': 'uxiu-template-monorepo-vue3-raw-sql-master/'
	},
	color(text: string) {
		return styleText('green', text)
	},
	dangerColor(text: string) {
		return styleText('red', text)
	},
	tipColor(text: string) {
		return styleText('gray', text)
	},
	successEmoji: '√ 🤤',
	errorEmoji: '✗ 🤤',
	doubtEmoji: '? 🤤',
	byeEmoji: '🤤 🤤 🤤'
}
