@echo off
echo Starting LUNA NAV FastAPI Backend...
cd /d "%~dp0backend"
set PYTHONPATH=%~dp0backend
"C:\Users\kupsa\AppData\Local\Programs\Python\Python313\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
