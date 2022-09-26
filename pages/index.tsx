import type { GetServerSideProps, NextPage } from 'next'
import Head from "next/head"
import { parseCookies } from "nookies"
import { FormEvent, useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { signIn } = useAuth()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const data = { email, password }
    await signIn(data)
  }

  return (
    <>
      <Head>
        <title>Next Auth</title>
      </Head>
      
      <form className={styles.container} onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Entrar</button>
      </form>
    </>
  )
}

export default Home

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = parseCookies(context)

  if (cookies["next-auth-token"]) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false
      }
    }
  }
  
  return {
    props: {}
  }
}
