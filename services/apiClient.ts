import { setupAPIClient } from "./api";

export const api = setupAPIClient()

export function resetDefaultHeader(headerName: string, headerValue: any) {
  api.defaults.headers = {
    ...api.defaults.headers,
    [headerName]: headerValue
  } as typeof api.defaults.headers
}
