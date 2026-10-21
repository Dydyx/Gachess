@echo off
rem Lance le serveur local puis ouvre l'application dans le navigateur.
cd /d "%~dp0"
start "" http://localhost:8642
node server.js
