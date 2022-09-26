import { useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { setupAPIClient } from "../services/api"
import { api } from "../services/apiClient"
import { withSSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {
  const { user } = useAuth()

  useEffect(() => {
    api.get("/me")
      .then(console.log)
      .catch(console.log)
  }, [])

  return (
    <>
      <h1>Dashboard</h1>
      <h2>{user?.email}</h2>
    </>
  )
}

export const getServerSideProps = withSSRAuth(async (context) => {
  const apiClient = setupAPIClient(context)
  const response = await apiClient.get("/me")
  
  console.log(response)

  return {
    props: {}
  }
})
