@echo off
echo.db 백업 시작...

rem Change to the PostgreSQL bin directory
d:
cd d:\PostgreSQL\17\bin

rem Perform the PostgreSQL database backup
.\pg_dump -U postgres -h localhost -p 5432 -d mkf -F c -b -v -f "d:\backup\mkf_backup.dump"

rem Check if pg_dump was successful
if errorlevel 1 (
    echo.오류 발생: PostgreSQL DB 백업 실패. 메시지를 확인하세요.
    pause
    goto :eof
)

rem Change to the Git repository directory
d:
cd \backup

rem Remove the 'backup' remote if it exists and re-add it (optional, for clean setup)
git remote remove backup > nul 2>&1
git remote add backup https://github.com/mkfpartners/backup

rem Ensure we are on the 'backup' branch. Create it if it doesn't exist.
git checkout backup || git checkout -b backup

rem Stage the backup file
git add mkf_backup.dump

rem Commit the backup file with date and time
git commit -m "DB backup: %date% %time%"

rem Push the backup branch to the 'backup' remote
git push backup backup

rem Check if git push was successful
if errorlevel 1 (
    echo.오류 발생: Git Push 실패. 메시지를 확인하세요.
) else (
    echo.백업 완료:
)

pause