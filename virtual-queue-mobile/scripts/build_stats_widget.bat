@echo off
setlocal

set ROOT=%~dp0..
set OUT=%ROOT%\..\virtual-queue-back\src\main\resources\static\flutter

echo Building stats widget...
pushd "%ROOT%"
flutter build web -t lib/main_stats.dart --release
if errorlevel 1 exit /b 1

if not exist "%OUT%" mkdir "%OUT%"
xcopy /E /I /Y "build\web\*" "%OUT%\"
popd

echo Widget copied to %OUT%
