import color from 'picocolors'

export const conf = {
	urls: {
		default: 'https://github.com/fy-store/uxiu-template-default/archive/refs/heads/master.zip'
	},
	replaceStrs: {
		default: 'uxiu-template-default-master/'
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
