@echo off
rem Arrete le serveur Gachess (le processus qui ecoute sur le port 8642), sans toucher aux autres serveurs Node.
setlocal
set PORT=8642
set FOUND=
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
  if not defined FOUND (
    set FOUND=%%P
    taskkill /PID %%P /F >nul 2>&1 && echo Serveur Gachess arrete (PID %%P).
  )
)
if not defined FOUND echo Aucun serveur Gachess en cours sur le port %PORT%.
timeout /t 3 >nul
