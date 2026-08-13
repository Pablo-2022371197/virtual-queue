import { useId, type SVGProps } from 'react'

type TurnixMarkProps = SVGProps<SVGSVGElement> & {
  size?: number
  /** Dark tile behind the mark (favicon / app icon). */
  framed?: boolean
}

export function TurnixMark({
  size = 32,
  framed = false,
  className,
  ...props
}: TurnixMarkProps) {
  const rawId = useId().replace(/:/g, '')
  const ribbonId = `turnix-ribbon-${rawId}`
  const arrowId = `turnix-arrow-${rawId}`
  const maskId = `turnix-gaps-${rawId}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient
          id={ribbonId}
          x1="8"
          y1="14"
          x2="56"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#C77DFF" />
          <stop offset="0.42" stopColor="#AA3BFF" />
          <stop offset="1" stopColor="#6D1FD6" />
        </linearGradient>
        <linearGradient
          id={arrowId}
          x1="42"
          y1="16"
          x2="60"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#C77DFF" />
          <stop offset="1" stopColor="#8B33E8" />
        </linearGradient>
        <mask id={maskId}>
          <rect width="64" height="64" fill="#fff" />
          <rect x="25.2" y="37" width="3.2" height="14" rx="0.6" fill="#000" />
          <rect x="35.6" y="37" width="3.2" height="14" rx="0.6" fill="#000" />
        </mask>
      </defs>
      {framed && <rect width="64" height="64" rx="14" fill="#121212" />}
      <g mask={`url(#${maskId})`}>
        <path
          fill={`url(#${ribbonId})`}
          fillRule="evenodd"
          d="M20 16h24a16 16 0 0 1 0 32H20a16 16 0 0 1 0-32Zm0 10h24a6 6 0 0 1 0 12H20a6 6 0 0 1 0-12Z"
        />
      </g>
      <path fill={`url(#${arrowId})`} d="M43.2 17.2 58.5 26.5 43.2 35.8 46.8 26.5Z" />
    </svg>
  )
}
