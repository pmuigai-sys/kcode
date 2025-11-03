@echo off
setlocal enabledelayedexpansion

where ollama >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo [setup] Ollama CLI not found. Please install Ollama before continuing.
  exit /b 1
)

echo [setup] Installing Node dependencies via yarn
corepack enable
yarn install

echo [setup] Pulling required Ollama models
ollama pull codellama
ollama pull llama3

echo [setup] Building Tailwind assets
yarn compile:tailwind

echo [setup] Initialization complete. Launch with "yarn compile && yarn package"
endlocal
