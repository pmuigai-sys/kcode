#!/usr/bin/env bash
set -euo pipefail

if ! command -v ollama &>/dev/null; then
  echo "[setup] Ollama CLI not found. Please install Ollama before continuing." >&2
  exit 1
fi

echo "[setup] Installing Node dependencies via yarn"
corepack enable
yarn install

echo "[setup] Pulling required Ollama models"
ollama pull codellama || true
ollama pull llama3 || true

echo "[setup] Building Tailwind assets"
yarn compile:tailwind

echo "[setup] Initialization complete. Launch with 'yarn compile && yarn package'"
