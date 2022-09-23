import axios from "axios"
import { parseCookies } from "nookies"

const cookies = parseCookies()

export const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    Authorization: `Bearer ${cookies["next-auth-token"]}`
  }
})

export function resetDefaultHeader(headerName: string, headerValue: any) {
  api.defaults.headers = {
    ...api.defaults.headers,
    [headerName]: headerValue
  } as typeof api.defaults.headers
}
