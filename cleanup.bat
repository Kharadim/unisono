@echo off
title Unisono Cleanup
echo.
echo  ============================================
echo   Unisono - Zombie-Prozesse aufraumen
echo  ============================================
echo.

set FOUND=0

:: --- Check Vite on port 1420 ---
echo [1/3] Pruefe Port 1420 (Vite)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":1420 "') do (
    echo        PID %%p belegt Port 1420
    taskkill /F /PID %%p >nul 2>&1
    if not errorlevel 1 (
        echo        [OK] Prozess %%p beendet
        set FOUND=1
    ) else (
        echo        [!] Konnte %%p nicht beenden
    )
)
if %FOUND%==0 echo        Frei - nichts zu tun

:: --- Check Backend on port 8001 ---
set FOUND3=0
echo.
echo [2/3] Pruefe Port 8001 (Standalone-Backend)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":8001 "') do (
    echo        PID %%p belegt Port 8001
    taskkill /F /PID %%p >nul 2>&1
    if not errorlevel 1 (
        echo        [OK] Prozess %%p beendet
        set FOUND3=1
    ) else (
        echo        [!] Konnte %%p nicht beenden
    )
)
if %FOUND3%==0 echo        Frei - nichts zu tun

:: --- Check orphaned sidecar ---
set FOUND2=0
echo.
echo [3/3] Pruefe unisono-server Sidecar...
for /f "tokens=2" %%p in ('tasklist /FI "IMAGENAME eq unisono-server*" /NH 2^>nul ^| findstr /I "unisono"') do (
    echo        PID %%p laeuft noch
    taskkill /F /PID %%p >nul 2>&1
    if not errorlevel 1 (
        echo        [OK] Prozess %%p beendet
        set FOUND2=1
    ) else (
        echo        [!] Konnte %%p nicht beenden
    )
)
if %FOUND2%==0 echo        Kein Sidecar gefunden - nichts zu tun

echo.
echo  ============================================
echo   Fertig. Du kannst Unisono jetzt starten.
echo  ============================================
echo.
pause
