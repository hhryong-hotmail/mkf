@echo off
set "DEST_DIR=D:\backup"
set "REPO_URL=https://github.com/MKFpartners/backup.git"

if not exist "%DEST_DIR%" mkdir "%DEST_DIR%"
cd /d "%DEST_DIR%"

if exist "backup" rmdir /s /q "backup"

echo Git 저장소 다운로드 중...
git clone "%REPO_URL%"

if %errorlevel% equ 0 (
    echo 완료: %DEST_DIR%\backup
) else (
    echo 실패: Git 설치 또는 URL 확인 필요
)

REM 수정된 pg_restore 명령어
"d:\PostgreSQL\17\bin\pg_restore" -U postgres -h localhost -p 5432 -d mkf -c -v "d:\backup\backup\backup\mkf_backup.dump"

pause