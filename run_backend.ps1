$env:PYTHONPATH = "$PSScriptRoot\backend"
Set-Location "$PSScriptRoot\backend"
& "C:\Users\kupsa\AppData\Local\Programs\Python\Python313\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
