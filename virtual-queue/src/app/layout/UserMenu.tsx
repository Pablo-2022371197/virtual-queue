import type { Key } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Dropdown, Label } from '@heroui/react'
import { BarChart3, LogOut, Settings, Ticket, UserCircle, Users } from 'lucide-react'
import { useAuth } from '../../features/auth/useAuth'

export function UserMenu() {
  const navigate = useNavigate()
  const { user, logout, hasRole } = useAuth()
  const displayName = user?.fullName ?? user?.username ?? 'Usuario'

  async function handleAction(key: Key) {
    switch (key) {
      case 'home':
        navigate('/home')
        break
      case 'stats':
        navigate('/estadisticas')
        break
      case 'staff':
        navigate('/staff')
        break
      case 'admin':
        navigate('/admin/places')
        break
      case 'account':
        navigate('/cuenta')
        break
      case 'logout':
        await logout()
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
            {displayName.slice(0, 1).toUpperCase()}
          </Avatar.Fallback>
        </Avatar>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-foreground sm:inline">
          {displayName}
        </span>
      </Dropdown.Trigger>

      <Dropdown.Popover placement="bottom end">
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <Avatar.Fallback className="bg-accent text-xs font-semibold text-accent-foreground">
                {displayName.slice(0, 1).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col gap-0">
              <p className="text-sm font-medium leading-5 text-foreground">{displayName}</p>
              <p className="text-xs leading-none text-muted">{user?.role ?? 'Sesión activa'}</p>
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
          {hasRole('STAFF', 'ADMIN') && (
            <Dropdown.Item id="staff" textValue="Panel de personal">
              <div className="flex w-full items-center justify-between gap-2">
                <Label>Panel de personal</Label>
                <Users size={14} strokeWidth={1.75} className="text-muted" />
              </div>
            </Dropdown.Item>
          )}
          {hasRole('ADMIN') && (
            <Dropdown.Item id="admin" textValue="Administración">
              <div className="flex w-full items-center justify-between gap-2">
                <Label>Administración</Label>
                <Settings size={14} strokeWidth={1.75} className="text-muted" />
              </div>
            </Dropdown.Item>
          )}
          <Dropdown.Item id="account" textValue="Mi cuenta">
            <div className="flex w-full items-center justify-between gap-2">
              <Label>Mi cuenta</Label>
              <UserCircle size={14} strokeWidth={1.75} className="text-muted" />
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
