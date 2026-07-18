const baseURL = import.meta.env.VITE_API_URL

export type RequestConfig = {
  url: string
  headers: Record<string, string>
  body?: unknown
  method?: string
}

type RequestInterceptor = (
  config: RequestConfig,
) => RequestConfig | Promise<RequestConfig>

type ResponseInterceptor = (
  response: Response,
  config: RequestConfig,
) => Response | Promise<Response>

export class ApiError extends Error {
  response: Response

  constructor(message: string, response: Response) {
    super(message)
    this.name = 'ApiError'
    this.response = response
  }
}

const requestInterceptors: RequestInterceptor[] = []
const responseInterceptors: ResponseInterceptor[] = []

export function addRequestInterceptor(interceptor: RequestInterceptor) {
  requestInterceptors.push(interceptor)
}

export function addResponseInterceptor(interceptor: ResponseInterceptor) {
  responseInterceptors.push(interceptor)
}

addRequestInterceptor((config) => {
  const token = localStorage.getItem('jwt')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return config
})

addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('jwt')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
  return response
})

type ClientOptions = Omit<RequestInit, 'body'> & { body?: unknown }

async function applyRequestInterceptors(
  url: string,
  options: ClientOptions,
): Promise<RequestConfig> {
  let config: RequestConfig = {
    url: url.startsWith('http') ? url : `${baseURL}${url}`,
    headers: {
      ...(options.headers as Record<string, string> | undefined),
    },
    body: options.body,
    method: options.method ?? 'GET',
  }

  if (config.body !== undefined && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }

  for (const interceptor of requestInterceptors) {
    config = await interceptor(config)
  }

  return config
}

async function applyResponseInterceptors(
  response: Response,
  config: RequestConfig,
): Promise<Response> {
  let result = response
  for (const interceptor of responseInterceptors) {
    result = await interceptor(result, config)
  }
  return result
}

export async function client<T = unknown>(
  url: string,
  options: ClientOptions = {},
): Promise<T> {
  const config = await applyRequestInterceptors(url, options)
  const { url: requestUrl, headers, body, method = 'GET' } = config

  let response = await fetch(requestUrl, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  response = await applyResponseInterceptors(response, config)

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json() as Promise<T>
}

export default client
