#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$flutterProject = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendStatic = Join-Path (Split-Path -Parent $flutterProject) 'virtual-queue-back/src/main/resources/static/flutter'

Push-Location $flutterProject
try {
  flutter build web --release --web-renderer canvaskit -t lib/main_stats.dart
  New-Item -ItemType Directory -Force -Path $backendStatic | Out-Null
  Copy-Item -Path 'build/web/*' -Destination $backendStatic -Recurse -Force
  Write-Host "Flutter web bundle copied to $backendStatic"
}
finally {
  Pop-Location
}
