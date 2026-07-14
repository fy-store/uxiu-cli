import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request, { FetchError } from '../src/utils/fetchSource/index.js'

describe('fetchSource', () => {
	let fetchMock: ReturnType<typeof vi.fn>

	beforeEach(() => {
		fetchMock = vi.fn()
		vi.stubGlobal('fetch', fetchMock)
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.unstubAllGlobals()
	})

	it('自动解析 JSON 响应并返回响应元数据', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ name: 'uxiu' }), {
				status: 200,
				statusText: 'OK',
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		)

		const response = await request<{ name: string }>('https://example.com/template')

		expect(response.data).toEqual({ name: 'uxiu' })
		expect(response).toMatchObject({ status: 200, statusText: 'OK', ok: true })
		expect(fetchMock).toHaveBeenCalledOnce()
		expect(fetchMock.mock.calls[0][1]).toMatchObject({
			method: 'GET',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' }
		})
	})

	it('序列化普通对象请求体，并保留自定义请求头', async () => {
		fetchMock.mockResolvedValue(new Response('created', { status: 201, headers: { 'content-type': 'text/plain' } }))

		const response = await request.post<string, { name: string }>(
			'https://example.com/projects',
			{ name: 'demo' },
			{ headers: { Authorization: 'Bearer token' } }
		)

		expect(response.data).toBe('created')
		expect(fetchMock.mock.calls[0][1]).toMatchObject({
			method: 'POST',
			body: JSON.stringify({ name: 'demo' }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer token'
			}
		})
	})

	it('支持显式指定 arraybuffer 响应类型', async () => {
		fetchMock.mockResolvedValue(new Response(Uint8Array.from([1, 2, 3])))

		const response = await request<ArrayBuffer>('https://example.com/archive.zip', {
			responseType: 'arraybuffer'
		})

		expect(Array.from(new Uint8Array(response.data))).toEqual([1, 2, 3])
	})

	it('将 HTTP 错误转换为包含响应详情的 FetchError', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ message: 'unavailable' }), {
				status: 503,
				statusText: 'Service Unavailable',
				headers: { 'content-type': 'application/json' }
			})
		)

		const error = await request('https://example.com/failure').catch((reason) => reason)

		expect(error).toBeInstanceOf(FetchError)
		expect(error).toMatchObject({
			type: 'http',
			status: 503,
			response: {
				status: 503,
				statusText: 'Service Unavailable',
				body: { message: 'unavailable' }
			}
		})
	})

	it('将无效 JSON 转换为 parse 类型错误', async () => {
		fetchMock.mockResolvedValue(new Response('{invalid json', { headers: { 'content-type': 'application/json' } }))

		await expect(request('https://example.com/data')).rejects.toMatchObject({ type: 'parse' })
	})

	it('网络失败后按照配置重试并调用 onRetry', async () => {
		vi.useFakeTimers()
		const onRetry = vi.fn()
		fetchMock
			.mockRejectedValueOnce(new TypeError('fetch failed'))
			.mockResolvedValueOnce(new Response('ok', { headers: { 'content-type': 'text/plain' } }))

		const responsePromise = request<string>('https://example.com/retry', {
			retries: 1,
			retryDelay: 20,
			onRetry
		})
		await vi.runAllTimersAsync()

		await expect(responsePromise).resolves.toMatchObject({ data: 'ok' })
		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(onRetry).toHaveBeenCalledWith(
			expect.objectContaining({ attempt: 1, maxRetries: 1, delay: 20, url: 'https://example.com/retry' })
		)
	})

	it('请求超时后中止请求且不重试', async () => {
		vi.useFakeTimers()
		fetchMock.mockImplementation(() => new Promise(() => undefined))

		const responsePromise = request('https://example.com/slow', { timeout: 50, retries: 2 })
		const rejection = expect(responsePromise).rejects.toMatchObject({ type: 'timeout' })
		await vi.advanceTimersByTimeAsync(50)

		await rejection
		expect(fetchMock).toHaveBeenCalledOnce()
	})

	it('外部信号已取消时不发送请求', async () => {
		const controller = new AbortController()
		controller.abort()

		await expect(request('https://example.com/cancelled', { signal: controller.signal })).rejects.toMatchObject({
			type: 'abort'
		})
		expect(fetchMock).not.toHaveBeenCalled()
	})
})
