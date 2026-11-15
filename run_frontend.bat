@echo off
echo Starting LUNA NAV React Frontend...
cd /d "%~dp0frontend"
set PATH=C:\Users\kupsa\AppData\Roaming\JetBrains\PyCharm2025.2\node\versions\22.18.0;%PATH%
npm run dev
pause
