import { useEffect } from "react"
import { Can } from "../components/Can"
import { useAuth } from "../contexts/AuthContext"
import { setupAPIClient } from "../services/api"
import { api } from "../services/apiClient"
import { withSSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {
  const { user, signOut } = useAuth()

  useEffect(() => {
    api.get("/me")
      .then(console.log)
      .catch(console.log)
  }, [])

  return (
    <>
      <h1>Dashboard</h1>
      <h2>{user?.email}</h2>

      <button onClick={signOut}>Sign out</button>

      <Can
        permissions={["metrics.list"]}
        roles={["administrator", "editor"]}
      >
        <div>Métricas</div>
      </Can>
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
