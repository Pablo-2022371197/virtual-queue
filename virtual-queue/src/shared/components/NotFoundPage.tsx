import { Link } from 'react-router-dom'
import { Button, Card } from '@heroui/react'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <Card.Header>
          <Card.Title>Página no encontrada</Card.Title>
          <Card.Description>
            La ruta que buscas no existe o fue movida.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="justify-center">
          <Link to="/">
            <Button variant="primary">Ir al inicio</Button>
          </Link>
        </Card.Footer>
      </Card>
    </div>
  )
}
