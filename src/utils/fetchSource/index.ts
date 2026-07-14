/**
 * 错误类型枚举
 */
export type FetchErrorType = 'network' | 'timeout' | 'http' | 'abort' | 'parse' | 'unknown';

/**
 * HTTP 错误响应详情
 */
export interface HttpErrorResponse {
  status: number;
  statusText: string;
  body: any;
  headers: Headers;
}

/**
 * 自定义错误类
 */
export class FetchError extends Error {
  public readonly name: string = 'FetchError';
  public readonly type: FetchErrorType;
  public readonly status: number | null;
  public readonly response: HttpErrorResponse | null;
  public readonly timestamp: number;

  constructor(
    message: string,
    type: FetchErrorType,
    status: number | null = null,
    response: HttpErrorResponse | null = null
  ) {
    super(message);
    this.type = type;
    this.status = status;
    this.response = response;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}

/**
 * 重试回调上下文
 */
export interface RetryContext {
  attempt: number;
  maxRetries: number;
  error: FetchError | Error;
  url: string;
  delay: number;
}

/**
 * 响应解析类型
 */
export type ResponseType = 'json' | 'text' | 'blob' | 'arraybuffer' | 'formdata';

/**
 * 请求配置选项
 */
export interface RequestOptions<T = unknown> {
  method?: string;
  headers?: HeadersInit;
  body?: T | FormData | URLSearchParams | string | null;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  onRetry?: (context: RetryContext) => void;
  /** 强制指定响应解析类型，默认根据 Content-Type 自动判断 */
  responseType?: ResponseType;
}

/**
 * 成功响应封装
 */
export interface FetchResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  ok: true;
}

/**
 * 使用 fetch 封装的资源获取方法
 */
export async function request<T = any, B = any>(
  url: string,
  options: RequestOptions<B> = {}
): Promise<FetchResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = 30000,
    retries = 0,
    retryDelay = 1000,
    signal: externalSignal = null,
    credentials = 'include',
    onRetry = null,
    responseType = null, // 新增
  } = options;

  // 外部信号监听器（全局只绑定一次）
  let externalAbortHandler: (() => void) | null = null;
  let isExternalAborted = false;

  // 用于在外部 signal 触发时中断所有重试
  const abortAll = (reason?: any) => {
    isExternalAborted = true;
    // 如果传入了 reason，可以记录，但我们统一抛取消错误
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      isExternalAborted = true;
    } else {
      externalAbortHandler = () => {
        abortAll();
      };
      externalSignal.addEventListener('abort', externalAbortHandler, { once: true });
    }
  }

  // 清理函数（取消所有 pending 请求并移除监听）
  const cleanup = () => {
    if (externalAbortHandler && externalSignal) {
      externalSignal.removeEventListener('abort', externalAbortHandler);
      externalAbortHandler = null;
    }
  };

  // 执行单次请求（每次尝试新建 AbortController）
  const executeRequest = async (
    attempt: number
  ): Promise<FetchResponse<T>> => {
    // 如果在尝试前外部已取消，直接抛出
    if (isExternalAborted || (externalSignal && externalSignal.aborted)) {
      throw new FetchError('请求被取消', 'abort', null, null);
    }

    // 每次尝试独立的 AbortController
    const abortController = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // 将外部信号与内部信号连接：外部取消时终止本次请求
    const internalSignal = abortController.signal;
    let externalListener: (() => void) | null = null;
    if (externalSignal && !externalSignal.aborted) {
      externalListener = () => {
        abortController.abort();
      };
      externalSignal.addEventListener('abort', externalListener, { once: true });
    }

    // 清理本次请求的定时器和监听
    const clearLocal = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (externalListener && externalSignal) {
        externalSignal.removeEventListener('abort', externalListener);
        externalListener = null;
      }
    };

    try {
      // 构建 fetch 配置
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        credentials,
        signal: internalSignal,
      };

      // 处理请求体
      if (body !== null && body !== undefined) {
        if (
          typeof body === 'object' &&
          !(body instanceof FormData) &&
          !(body instanceof URLSearchParams) &&
          !(body instanceof Blob) &&
          !(body instanceof ArrayBuffer)
        ) {
          fetchOptions.body = JSON.stringify(body);
        } else {
          fetchOptions.body = body as BodyInit;
        }
      }

      // 超时 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          abortController.abort();
          reject(new FetchError(`请求超时 (${timeout}ms)`, 'timeout', null, null));
        }, timeout);
      });

      // 执行 fetch
      const fetchPromise = fetch(url, fetchOptions);
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      // 清除本次定时器/监听
      clearLocal();

      // 检查 HTTP 状态
      if (!response.ok) {
        let errorBody: any = null;
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            errorBody = await response.json();
          } else {
            errorBody = await response.text();
          }
        } catch (_) {
          // ignore
        }
        throw new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          'http',
          response.status,
          {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
            headers: response.headers,
          }
        );
      }

      // 解析响应体（优先使用 responseType）
      let data: T;
      if (responseType) {
        switch (responseType) {
          case 'json':
            data = await response.json() as T;
            break;
          case 'text':
            data = await response.text() as T;
            break;
          case 'blob':
            data = await response.blob() as T;
            break;
          case 'arraybuffer':
            data = await response.arrayBuffer() as T;
            break;
          case 'formdata':
            data = await response.formData() as T;
            break;
          default:
            data = await response.blob() as T;
        }
      } else {
        // 自动推断
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await response.json() as T;
        } else if (contentType.includes('text/')) {
          data = await response.text() as T;
        } else {
          data = await response.blob() as T;
        }
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        ok: true,
      };
    } catch (error: unknown) {
      clearLocal();

      // 处理 AbortError（可能来自超时或外部取消）
      if (error instanceof Error && error.name === 'AbortError') {
        // 检查是否因外部取消导致
        if (externalSignal && externalSignal.aborted) {
          throw new FetchError('请求被取消', 'abort', null, null);
        }
        // 否则可能是超时触发的 abort，但我们已在超时中抛出 FetchError，所以这里不会走到
        throw new FetchError('请求被中止', 'abort', null, null);
      }

      // 超时错误（已由 FetchError 抛出）
      if (error instanceof FetchError && error.type === 'timeout') {
        throw error;
      }

      // 网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new FetchError(`网络错误: ${error.message}`, 'network', null, null);
      }

      // JSON 解析错误
      if (error instanceof SyntaxError) {
        throw new FetchError(`解析错误: ${error.message}`, 'parse', null, null);
      }

      // 已是 FetchError
      if (error instanceof FetchError) {
        throw error;
      }

      // 未知
      throw new FetchError(
        `未知错误: ${error instanceof Error ? error.message : String(error)}`,
        'unknown',
        null,
        null
      );
    }
  };

  // 重试循环
  let lastError: Error | FetchError | null = null;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await executeRequest(attempt);
      cleanup(); // 成功，清理外部监听
      return result;
    } catch (error: unknown) {
      lastError = error as Error | FetchError;

      // 如果是取消或超时错误，不再重试
      if (
        error instanceof FetchError &&
        (error.type === 'abort' || error.type === 'timeout')
      ) {
        cleanup();
        throw error;
      }

      // 如果已达到最大重试次数
      if (attempt > retries) {
        cleanup();
        throw error;
      }

      // 执行重试回调
      if (typeof onRetry === 'function') {
        onRetry({
          attempt,
          maxRetries: retries,
          error: error as Error,
          url,
          delay: retryDelay,
        });
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  cleanup();
  throw lastError || new FetchError('请求失败，原因未知', 'unknown', null, null);
}

// ============ 便捷方法 ============

request.get = function <T = any>(
  url: string,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<FetchResponse<T>> {
  return request<T>(url, { ...options, method: 'GET' });
};

request.post = function <T = any, B = any>(
  url: string,
  body?: B,
  options?: Omit<RequestOptions<B>, 'method' | 'body'>
): Promise<FetchResponse<T>> {
  return request<T, B>(url, { ...options, method: 'POST', body });
};

request.put = function <T = any, B = any>(
  url: string,
  body?: B,
  options?: Omit<RequestOptions<B>, 'method' | 'body'>
): Promise<FetchResponse<T>> {
  return request<T, B>(url, { ...options, method: 'PUT', body });
};

request.delete = function <T = any>(
  url: string,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<FetchResponse<T>> {
  return request<T>(url, { ...options, method: 'DELETE' });
};

request.patch = function <T = any, B = any>(
  url: string,
  body?: B,
  options?: Omit<RequestOptions<B>, 'method' | 'body'>
): Promise<FetchResponse<T>> {
  return request<T, B>(url, { ...options, method: 'PATCH', body });
};

export type RequestFunction = typeof request & {
  get: typeof request.get;
  post: typeof request.post;
  put: typeof request.put;
  delete: typeof request.delete;
  patch: typeof request.patch;
};

export default request;