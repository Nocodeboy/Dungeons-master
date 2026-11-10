#!/usr/bin/env bash
# Exporta el APK firmado. Las credenciales se pasan por variables de entorno (no se guardan en el repositorio).
# Uso: tools/export_android.sh [ruta_keystore] [archivo_con_contraseña]
set -euo pipefail
cd "$(dirname "$0")/.."
KS="${1:-android/marca-de-granito-release.keystore}"
PASSFILE="${2:-android/.keystore_pass}"
export GODOT_ANDROID_KEYSTORE_RELEASE_PATH="$(realpath "$KS")"
export GODOT_ANDROID_KEYSTORE_RELEASE_USER="marcadegranito"
export GODOT_ANDROID_KEYSTORE_RELEASE_PASSWORD="$(cat "$PASSFILE")"
mkdir -p build
godot --headless --path . --export-release "Android" build/MarcaDeGranito.apk
