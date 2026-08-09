import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button, InputGroup, Label, TextField } from '@heroui/react'

type PasswordFieldProps = {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
}

export function PasswordField({
  label,
  name,
  value,
  onChange,
  autoComplete,
  placeholder = '••••••',
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <TextField name={name} isRequired fullWidth value={value} onChange={onChange}>
      <Label>{label}</Label>
      <InputGroup fullWidth>
        <InputGroup.Input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <InputGroup.Suffix>
          <Button
            type="button"
            variant="ghost"
            isIconOnly
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  )
}
