$nodeDir = "C:\Users\kupsa\AppData\Roaming\JetBrains\PyCharm2025.2\node\versions\22.18.0"
$env:PATH = "$nodeDir;$env:PATH"
Set-Location "$PSScriptRoot\frontend"
& "$nodeDir\npm.cmd" run dev
