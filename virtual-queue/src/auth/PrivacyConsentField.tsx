import { Link } from 'react-router-dom'
import { Checkbox, Label } from '@heroui/react'

const CONSENT_FIELD_ID = 'privacy-consent'

interface PrivacyConsentFieldProps {
  isSelected: boolean
  onChange: (value: boolean) => void
  isInvalid?: boolean
}

export function PrivacyConsentField({
  isSelected,
  onChange,
  isInvalid = false,
}: PrivacyConsentFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <Checkbox
          id={CONSENT_FIELD_ID}
          name="privacyConsent"
          variant="secondary"
          isSelected={isSelected}
          onChange={onChange}
          isInvalid={isInvalid}
          className="shrink-0 pt-0.5"
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>

        <Label
          htmlFor={CONSENT_FIELD_ID}
          className="text-sm font-normal leading-snug text-muted"
        >
          He leído y acepto la{' '}
          <Link
            to="/privacidad"
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            política de privacidad
          </Link>{' '}
          y los{' '}
          <Link
            to="/terminos"
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            términos de uso
          </Link>
          .
        </Label>
      </div>

      {isInvalid && (
        <p className="text-xs text-danger" role="alert">
          Debes aceptar la política de privacidad y los términos para continuar.
        </p>
      )}
    </div>
  )
}
