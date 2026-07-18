import { useState, type FormEvent } from 'react'
import { Alert, Button, Input, Label, TextField, TextArea } from '@heroui/react'

interface ContactFormProps {
  id?: string
  compact?: boolean
}

export function ContactForm({ id = 'contact-form', compact = false }: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSent(true)
    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <form id={id} className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {sent && (
        <Alert status="success">
          Mensaje enviado. Te contactaremos pronto.
        </Alert>
      )}

      <TextField
        name="name"
        isRequired
        fullWidth
        value={name}
        onChange={setName}
      >
        <Label>Nombre</Label>
        <Input placeholder="Tu nombre" autoComplete="name" />
      </TextField>

      <TextField
        name="email"
        type="email"
        isRequired
        fullWidth
        value={email}
        onChange={setEmail}
      >
        <Label>Correo electrónico</Label>
        <Input placeholder="tu@correo.com" autoComplete="email" />
      </TextField>

      <TextField
        name="message"
        isRequired
        fullWidth
        value={message}
        onChange={setMessage}
      >
        <Label>Mensaje</Label>
        <TextArea
          placeholder="¿En qué podemos ayudarte?"
          rows={compact ? 3 : 4}
        />
      </TextField>

      <Button type="submit" variant="primary" fullWidth>
        Enviar mensaje
      </Button>
    </form>
  )
}
