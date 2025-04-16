import color from 'picocolors'

export const conf = {
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
		return color.green(text)
	},
	dangerColor(text: string) {
		return color.red(text)
	},
	tipColor(text: string) {
		return color.gray(text)
	},
	successEmoji: '✔ 🤤',
	errorEmoji: '✖ 🤤',
	doubtEmoji: '? 🤤',
	byeEmoji: '🤤 🤤 🤤'
}

export default conf
