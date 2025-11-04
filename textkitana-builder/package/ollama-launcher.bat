@echo off
REM Ensure Ollama is running when the packaged app starts
for /f "tokens=*" %%S in ('sc query "Ollama" ^| findstr /i "STATE"') do set SERVICE_LINE=%%S
echo %SERVICE_LINE% | findstr /i "running" >nul
if errorlevel 1 (
  start "Ollama" /min "C:\\Program Files\\Ollama\\ollama.exe" serve
  timeout /t 5 >nul
)
exit /b 0
