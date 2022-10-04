import { withSSRAuth } from "../utils/withSSRAuth"

export default function Metrics() {
  return (
    <>
      <h1>Métricas</h1>
    </>
  )
}

export const getServerSideProps = withSSRAuth(async (context) => {
  return {
    props: {}
  }
}, {
  permissions: ["metrics.list"],
  roles: ["administrator"]
})
