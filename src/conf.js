import chalk from 'chalk'

export const conf = {
	urls: {
		default: 'https://github.com/fy-store/uxiu-template-default/archive/refs/heads/master.zip',
		rawMysqlAndLog4js: 'https://github.com/fy-store/uxiu-template-default/archive/refs/heads/master.zip'
	},
	replaceStrs: {
		default: 'uxiu-template-default-master/',
		rawMysqlAndLog4js: 'uxiu-template-default-master/'
	},
	color: chalk.hex('#1bd1a5'),
	dangerColor: chalk.hex('#F56C6C'),
	tipColor: chalk.hex('#909399'),
	successEmoji: '✔ 🤤',
	errorEmoji: '✖ 🤤',
	doubtEmoji: '? 🤤',
	byeEmoji: '🤤 🤤 🤤'
}
