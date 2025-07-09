@echo off
set "TARGET_DIR=d:\mkf"
set "REPO_URL=https://github.com/MKFpartners/mkf.git"

REM 오늘 날짜 생성 (YYYYMMDD 형식)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "dt=%%I"
set "TODAY=%dt:~0,4%%dt:~4,2%%dt:~6,2%"

REM 기존 폴더가 있으면 날짜로 이름 변경
if exist "%TARGET_DIR%" (
    echo 기존 폴더 발견: %TARGET_DIR%
    set "BACKUP_DIR=%TARGET_DIR%.%TODAY%"
    echo 백업 폴더로 이름 변경: !BACKUP_DIR!
    ren "%TARGET_DIR%" "mkf.%TODAY%"
)

REM Git 클론 실행
echo Git 클론 시작...
git clone "%REPO_URL%" "%TARGET_DIR%"

if %errorlevel% equ 0 (
    echo 클론 완료: %TARGET_DIR%
) else (
    echo 클론 실패. Git 설치 또는 URL 확인 필요
)

pause