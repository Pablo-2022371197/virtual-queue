import type { Key } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Dropdown, Label } from '@heroui/react'
import { BarChart3, LogOut, Ticket } from 'lucide-react'
import { getCurrentUser, logout } from '@lib/auth'

export function UserMenu() {
  const navigate = useNavigate()
  const user = getCurrentUser() ?? 'Invitado'

  function handleAction(key: Key) {
    switch (key) {
      case 'home':
        navigate('/home')
        break
      case 'stats':
        navigate('/estadisticas')
        break
      case 'logout':
        logout()
        navigate('/login', { replace: true })
        break
    }
  }

  return (
    <Dropdown>
      <Dropdown.Trigger
        className="flex items-center gap-2 rounded-full outline-none"
        aria-label="Menú de usuario"
      >
        <Avatar size="sm">
          <Avatar.Fallback className="bg-accent text-xs font-semibold text-accent-foreground">
            {user.slice(0, 1).toUpperCase()}
          </Avatar.Fallback>
        </Avatar>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-foreground sm:inline">
          {user}
        </span>
      </Dropdown.Trigger>

      <Dropdown.Popover placement="bottom end">
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <Avatar.Fallback className="bg-accent text-xs font-semibold text-accent-foreground">
                {user.slice(0, 1).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col gap-0">
              <p className="text-sm font-medium leading-5 text-foreground">{user}</p>
              <p className="text-xs leading-none text-muted">Sesión activa</p>
            </div>
          </div>
        </div>

        <Dropdown.Menu onAction={handleAction}>
          <Dropdown.Item id="home" textValue="Mi turno">
            <div className="flex w-full items-center justify-between gap-2">
              <Label>Mi turno</Label>
              <Ticket size={14} strokeWidth={1.75} className="text-muted" />
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="stats" textValue="Estadísticas">
            <div className="flex w-full items-center justify-between gap-2">
              <Label>Estadísticas</Label>
              <BarChart3 size={14} strokeWidth={1.75} className="text-muted" />
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="logout" textValue="Cerrar sesión" variant="danger">
            <div className="flex w-full items-center justify-between gap-2">
              <Label>Cerrar sesión</Label>
              <LogOut size={14} strokeWidth={1.75} className="text-danger" />
            </div>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
