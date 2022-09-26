import axios, { AxiosError, AxiosRequestConfig } from "axios"
import { GetServerSidePropsContext } from "next"
import { parseCookies, setCookie } from "nookies"
import { signOut } from "../contexts/AuthContext"
import { AuthTokenError } from "./errors/AuthTokenError"

type FailedRequest = {
  onSuccess: (token: string) => void
  onFailure: (error: AxiosError) => void
}

let isRefreshing = false
let failedRequestsQueue: FailedRequest[] = []

export function setupAPIClient(context?: GetServerSidePropsContext) {
  let cookies = parseCookies(context)

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies["next-auth-token"]}`
    }
  })
  
  api.interceptors.response.use(
    response => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        return handleStatus401(error)
      }
    }
  )
  
  function handleStatus401(error: AxiosError) {
    const responseData = error.response?.data as any
    if (responseData?.code === "token.expired") {
      return refreshToken(error)
    } else {
      if (process.browser) {
        signOut()
      } else {
        return Promise.reject(new AuthTokenError())
      }
    }
    return Promise.reject(error)
  }
  
  function refreshToken(error: AxiosError) {
    const originalConfig = error.config
  
    if (isRefreshing) {
      return addFailedRequestToQueue(originalConfig)
    }
    isRefreshing = true
  
    // get fresh cookies
    cookies = parseCookies(context)
    const { "next-auth-refresh-token": refreshToken } = cookies
    api.post("/refresh", { refreshToken })
      .then(response => {
        const { token, refreshToken: newRefreshToken } = response.data
        setCookie(context, "next-auth-token", token, {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/"
        })
        setCookie(context, "next-auth-refresh-token", newRefreshToken, {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/"
        })
        resetDefaultHeader("Authorization", `Bearer ${token}`)
        failedRequestsQueue.forEach(request => request.onSuccess(token))
        failedRequestsQueue = []
      })
      .catch((error: AxiosError) => {
        failedRequestsQueue.forEach(request => request.onFailure(error))
        failedRequestsQueue = []
        
        if (process.browser) {
          signOut()
        }
      })
      .finally(() => isRefreshing = false)
  
    return addFailedRequestToQueue(originalConfig)
  }
  
  function addFailedRequestToQueue(originalConfig: AxiosRequestConfig) {
    return new Promise((resolve, reject) => {
      failedRequestsQueue.push({
        onSuccess: (token: string) => {
          originalConfig.headers = {
            ...originalConfig.headers,
            Authorization: `Bearer ${token}`
          } as typeof originalConfig.headers
          resolve(api(originalConfig))
        },
        onFailure: (error: AxiosError) => {
          reject(error)
        }
      })
    })
  }
  
  function resetDefaultHeader(headerName: string, headerValue: any) {
    api.defaults.headers = {
      ...api.defaults.headers,
      [headerName]: headerValue
    } as typeof api.defaults.headers
  }

  return api
}
