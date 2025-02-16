export type CreateOptions = {
    root: string
    name: string
    template: 'default' | 'rawMysqlAndLog4js'
}

export type BuildOptions = {
    root: string
    input: string
    output: string
    public: string
}
