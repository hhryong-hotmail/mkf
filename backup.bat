@echo off
setlocal enabledelayedexpansion

:: 현재 날짜와 시간을 가져와서 파일명에 사용
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "NN=%dt:~10,2%"

:: 백업 파일명 생성
set "backup_filename=MKF.%YYYY%-%MM%-%DD%_%HH%%NN%.D.7z"

:: 백업 디렉토리 확인 및 생성
if not exist "d:\backup\" mkdir "d:\backup\"

echo.
echo MKF 소스 백업을 시작합니다...
echo 백업 파일명: %backup_filename%
echo.

:: 7-Zip을 사용하여 압축 (올바른 문법 사용)
:: 먼저 d:\mkf로 이동
cd /d "d:\mkf"
"c:\Program Files\7-zip\7z.exe" a "d:\backup\%backup_filename%" "*" -x!"backup" -x!".git" -x!"node_modules" -x!"uploads\*.tmp"

if %errorlevel% equ 0 (
    echo.
    echo 백업이 성공적으로 완료되었습니다!
    echo 백업 위치: d:\backup\%backup_filename%
    echo.
) else (
    echo.
    echo 백업 중 오류가 발생했습니다. (오류 코드: %errorlevel%)
    echo.
)

pause
