import Router from "next/router";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api, resetDefaultHeader } from "../services/apiClient";

type SignInCredentials = {
  email: string
  password: string
}

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>
  signOut(): void
  user?: User
  isAuthenticated: boolean
}

let authChannel: BroadcastChannel
const AuthContext = createContext({} as AuthContextData)

type AuthProviderProps = {
  children: ReactNode
}

type User = {
  email: string
  permissions: string[]
  roles: string[]
}

export function signOut() { 
  destroyAuthenticationCookies()
  authChannel.postMessage("signOut")
  Router.push("/")
}

function destroyAuthenticationCookies() {
  destroyCookie(undefined, "next-auth-token")
  destroyCookie(undefined, "next-auth-refresh-token")
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user

  const onAuthChannelMessage = useCallback((message: any) => {
    switch (message.data) {
      case "signOut":
        signOut()
        break
      default:
        break
    }
  }, [])

  useEffect(() => {
    authChannel = new BroadcastChannel("auth")
    authChannel.onmessage = onAuthChannelMessage
  }, [onAuthChannelMessage])

  useEffect(() => {
    const { "next-auth-token": token } = parseCookies()
    if (!token) return
    
    api.get("/me")
      .then(response => {
        const { email, permissions, roles } = response.data
        setUser({ email, permissions, roles })
      })
      .catch(signOut)
  }, [])

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post("sessions", {
        email, password
      })
      const { token, refreshToken, permissions, roles } = response.data
      setCookie(undefined, "next-auth-token", token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/"
      })
      setCookie(undefined, "next-auth-refresh-token", refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/"
      })
      setUser({
        email,
        permissions,
        roles
      })
      resetDefaultHeader("Authorization", `Bearer ${token}`)
      Router.push("/dashboard")
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
