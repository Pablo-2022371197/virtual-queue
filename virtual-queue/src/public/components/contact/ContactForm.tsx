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
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!consent) {
      setConsentError(true)
      return
    }
    const subject = encodeURIComponent(`Contacto Virtual Queue — ${name}`)
    const body = encodeURIComponent(`Nombre: ${name}\nCorreo: ${email}\n\n${message}`)
    window.location.href = `mailto:soporte@virtualqueue.app?subject=${subject}&body=${body}`
    setSent(true)
    setName('')
    setEmail('')
    setMessage('')
    setConsent(false)
  }

  return (
    <form id={id} className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {sent && (
        <Alert status="success">
          Se abrió tu cliente de correo. Si no aparece, escríbenos a soporte@virtualqueue.app
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

      <label className="flex items-start gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked)
            if (e.target.checked) setConsentError(false)
          }}
          className="mt-0.5"
        />
        Acepto el tratamiento de mis datos según la política de privacidad.
      </label>
      {consentError && (
        <Alert status="danger">Debes aceptar la política de privacidad.</Alert>
      )}

      <Button type="submit" variant="primary" fullWidth>
        Enviar mensaje
      </Button>
    </form>
  )
}

