import color from 'picocolors'

export const conf = {
	urls: {
		default: 'https://github.com/fy-store/uxiu-template-default/archive/refs/heads/master.zip',
		rawMysqlAndLog4js: 'https://github.com/fy-store/uxiu-template-default/archive/refs/heads/master.zip'
	},
	replaceStrs: {
		default: 'uxiu-template-default-master/',
		rawMysqlAndLog4js: 'uxiu-template-default-master/'
	},
	color(text) {
		return color.green(text)
	},
	dangerColor(text) {
		return color.red(text)
	},
	tipColor(text) {
		return color.gray(text)
	},
	successEmoji: '✔ 🤤',
	errorEmoji: '✖ 🤤',
	doubtEmoji: '? 🤤',
	byeEmoji: '🤤 🤤 🤤'
}
