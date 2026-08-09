import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert, Button, Card } from '@heroui/react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <Card className="max-w-md">
            <Card.Header>
              <Card.Title>Algo salió mal</Card.Title>
              <Card.Description>
                Ocurrió un error inesperado. Intenta recargar la página.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <Alert status="danger">
                Si el problema persiste, contacta al soporte.
              </Alert>
            </Card.Content>
            <Card.Footer>
              <Button variant="primary" onPress={() => window.location.reload()}>
                Recargar
              </Button>
            </Card.Footer>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
