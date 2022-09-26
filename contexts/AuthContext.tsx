import Router from "next/router";
import { parseCookies, setCookie } from "nookies";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api, resetDefaultHeader } from "../services/api";

type SignInCredentials = {
  email: string
  password: string
}

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>
  user?: User
  isAuthenticated: boolean
}

const AuthContext = createContext({} as AuthContextData)

type AuthProviderProps = {
  children: ReactNode
}

type User = {
  email: string
  permissions: string[]
  roles: string[]
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user

  useEffect(() => {
    const { "next-auth-token": token } = parseCookies()
    if (!token) return
    
    api.get("/me")
      .then(response => {
        const { email, permissions, roles } = response.data
        console.log("meu teste", response.data)
        setUser({ email, permissions, roles })
      })
      .catch(console.log)
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
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
