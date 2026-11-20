@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo   HOTLINE WHATSAPP AUTO-REPLY + DASHBOARD
echo ============================================================
echo.
if not exist node_modules (
  echo [1/2] Install dependensi (hanya sekali)...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install gagal. Pastikan Node.js sudah terinstall (https://nodejs.org).
    pause
    exit /b 1
  )
)
echo [2/2] Menjalankan aplikasi...
echo.
echo Setelah tulisan "Dashboard berjalan" muncul, buka di browser:
echo   http://localhost:3000
echo.
echo Tekan CTRL+C untuk menghentikan.
echo.
node src/index.js
pause
