@echo off
setlocal enabledelayedexpansion

:MENU
cls
echo.
echo.           MKS 관리
echo.
echo. 1. 소스를 d:\mkf 를 github.com\mkfpartners\mkf.git 로 보내기
echo.
echo.
echo. 2. 소스를 d:\mkf 를 github.com\hhryong-hotmail\mkf.git 로 보내기
echo.
echo.
echo. 3. 소스를 d:\mkf 를 d:\backup\7zip으로 압축
echo.
echo.
echo. 4. db 백업을 d:\backup 에 저장 (pg_dump)
echo.   - pg_dump -U postgres -h localhost -p 5432 -d mkf -F c -b -v -f mkf_backup.dump
echo.
echo.
echo. 5. db 새로 내려받기 (pg_restore)
echo.   - pg_restore
echo.
echo. 6. mkf 프로그램 소스를 github에 올리기 (hhryong-hotmail)
echo.
echo. 7. push my_name (현재 연결된 origin으로 임의 브랜치 푸시)
echo.
echo. 0. 프로그램 종료
echo.

set /p "sel=메뉴 번호를 입력하세요 : "

rem ---

rem 특수 명령어 처리

:: 입력값이 ..으로 시작하는 경우, 일반 명령어 실행
if "!sel:~0,2!"==".." (
    set "command=!sel:~2!"
    echo.실행할 명령어: !command!
    !command!
    echo.
    pause
    goto MENU
)

rem ---

rem  메뉴 선택에 따른 분기

if "%sel%"=="1" goto M1_GitPushMkfpartners
if "%sel%"=="2" goto M2_GitPushHhryongHotmail
if "%sel%"=="3" goto M3_ZipMkf
if "%sel%"=="4" goto M4_PgDump
if "%sel%"=="5" goto M5_PgRestore
if "%sel%"=="6" goto M6_GitPushMkfProgramSources
if "%sel%"=="7" goto M7_GitPushMyBranch
if "%sel%"=="0" goto END_PROGRAM

rem ---

rem 유효하지 않은 입력 처리

echo.
echo. 유효하지 않은 메뉴 번호입니다. 다시 시도하세요.
pause
goto MENU

rem ---

rem 1. mkfpartners Git Push

:M1_GitPushMkfpartners
d:
cd \mkf
git add .
set "NOW_DATE=%date:~0,4%-%date:~5,2%-%date:~8,2%"
set "NOW_TIME=%time:~0,2%-%time:~3,2%-%time:~6,2%"
git commit -m "Commit (mkfpartners): %NOW_DATE% %NOW_TIME%"

:: 기존 origin이 있다면 제거 (에러 메시지 숨김)
git remote remove origin 2>nul
git remote add origin https://github.com/mkfpartners/mkf.git
git branch -M main
echo.github id : MKFpartners를 선택
git push -u origin main

if not errorlevel 0 (
    echo.오류 발생: Git Push 실패. 메시지를 확인하세요.
)
pause
goto MENU

rem ---

rem 2. hhryong-hotmail Git Push

:M2_GitPushHhryongHotmail
d:
cd \mkf
git add .
set "NOW_DATE=%date:~0,4%-%date:~5,2%-%date:~8,2%"
set "NOW_TIME=%time:~0,2%-%time:~3,2%-%time:~6,2%"
git commit -m "Commit (hhryong-hotmail): %NOW_DATE% %NOW_TIME%"

:: 기존 origin이 있다면 제거 (에러 메시지 숨김)
git remote remove origin 2>nul
git remote add origin https://github.com/hhryong-hotmail/mkf.git
git branch -M main
echo.github id : hhryong-hotmail 선택
git push -u origin main

if not errorlevel 0 (
    echo.오류 발생: Git Push 실패. 메시지를 확인하세요.
)
pause
goto MENU

rem ---

rem 3. mkf 7-zip 압축

:M3_ZipMkf
backup.bat
goto MENU

rem ---

rem 4. DB 백업 (pg_dump)

:M4_PgDump
d:
echo.db 백업 시작...
set "pg_dump_path=c:\Program Files\PostgreSQL\17\bin\"
set "backup_output_dir=d:\Backup\"
set "mkf_repo_backup_dir=d:\mkf\backup\"

:: 현재 시간 포맷 (커밋 메시지용)
set "NOW_DATE=%date:~0,4%-%date:~5,2%-%date:~8,2%"
set "NOW_TIME=%time:~0,2%-%time:~3,2%-%time:~6,2%"

:: 파일명에 사용할 날짜/시간 포맷
set "date_formatted=!date:~0,4!!date:~5,2!!date:~8,2!"
set "time_raw=!time: =0!"
set "time_formatted=!time_raw:~0,2!!time_raw:~3,2!!time_raw:~6,2!"
set "dump_filename_with_timestamp=mkf_backup.dump.!date_formatted!.!time_formatted!"

"%pg_dump_path%pg_dump.exe" -U postgres -h localhost -p 5432 -d mkf -F c -b -v -f "%backup_output_dir%!dump_filename_with_timestamp!"

if not errorlevel 0 (
    echo.오류 발생: pg_dump 실패.
    pause
    goto MENU
)

echo.백업 완료: %backup_output_dir%!dump_filename_with_timestamp!

:: mkf repository에도 최신 덤프 복사 (덮어쓰기)
copy /Y "%backup_output_dir%!dump_filename_with_timestamp!" "%mkf_repo_backup_dir%mkf_backup.dump"

:: Git에 백업 파일 추가 및 푸시
cd /d d:\mkf
:: Git 2.35 이상 버전에서 필요한 설정 (한 번만 실행하면 됨)
:: git config --global --add safe.directory D:/mkf

git add mkf\backup/mkf_backup.dump
git commit -m "DB backup: %NOW_DATE% %NOW_TIME%"

:: 기본 origin에 푸시
git push origin main

if not errorlevel 0 (
    echo.오류 발생: Git Push 실패. 메시지를 확인하세요.
)
pause
goto MENU

rem ---

rem 5. DB 새로 내려받기 (pg_restore)

:M5_PgRestore
echo.vscode와 DBeaver를 중단시키세요!
pause
cd /d d:\mkf
echo. "암호:"를 요구하면 postgres를 치세요
:: mkf_backup.dump 파일이 d:\mkf 폴더에 있다고 가정합니다.
"c:\Program Files\PostgreSQL\17\bin\pg_restore.exe" --clean -U postgres -h localhost -p 5432 -d mkf mkf_backup.dump

if not errorlevel 0 (
    echo.오류 발생: pg_restore 실패.
    pause
    goto MENU
)
echo.DB 복원 완료.
pause
goto MENU

rem ---

rem 6. mkf 프로그램 소스를 GitHub에 올리기 (hhryong-hotmail)

:M6_GitPushMkfProgramSources
d:
cd \mkf
git add .
set "NOW_DATE=%date:~0,4%-%date:~5,2%-%date:~8,2%"
set "NOW_TIME=%time:~0,2%-%time:~3,2%-%time:~6,2%"
git commit -m "Commit (program sources): %NOW_DATE% %NOW_TIME%"

:: 기존 origin이 있다면 제거 (에러 메시지 숨김)
git remote remove origin 2>nul
git remote add origin https://github.com/hhryong-hotmail/mkf.git
git push -u origin main

if not errorlevel 0 (
    echo.오류 발생: Git Push 실패. 메시지를 확인하세요.
)
pause
goto MENU

rem ---

rem 7. Push My Branch (사용자 정의 브랜치 푸시)

:M7_GitPushMyBranch
d:
cd \mkf
set /p "branch_name=푸시할 브랜치 이름을 입력하세요 (예: my-feature-branch): "
if not defined branch_name (
    echo.브랜치 이름이 입력되지 않았습니다.
    pause
    goto MENU
)
git push origin !branch_name!
if not errorlevel 0 (
    echo.오류 발생: Git Push 실패. 메시지를 확인하세요.
)
pause
goto MENU

rem ---

rem 0. 프로그램 종료

:END_PROGRAM
echo. 프로그램을 종료합니다.
:: mkf.bat 파일이 현재 실행되는 위치에 있어야 함.
if exist ".\mkf.bat" (
    copy /Y ".\mkf.bat" "d:\mkf\data\"
    echo.mkf.bat 파일이 d:\mkf\data로 복사되었습니다.
) else (
    echo.mkf.bat 파일을 찾을 수 없어 복사하지 못했습니다.
)
pause
exit /b