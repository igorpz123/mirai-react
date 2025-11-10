import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export default function ProposalDetail() {
  const { id } = useParams()

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Proposta #{id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Conteúdo em desenvolvimento...</p>
        </CardContent>
      </Card>
    </Layout>
  )
}
