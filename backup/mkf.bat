@echo off
setlocal enabledelayedexpansion

:MENU
cls
echo.
echo.           MKS ����
echo.
echo. 1. �ҽ��� d:\mkf �� github.com\mkfpartners\mkf.git �� ������
echo.
echo.
echo. 2. �ҽ��� d:\mkf �� github.com\hhryong-hotmail\mkf.git �� ������
echo.
echo.
echo. 3. �ҽ��� d:\mkf �� d:\backup\7zip���� ����
echo.
echo.
echo. 4. db ����� d:\backup �� ���� (pg_dump)
echo.   - pg_dump -U postgres -h localhost -p 5432 -d mkf -F c -b -v -f mkf_backup.dump
echo.
echo.
echo. 5. db ���� �����ޱ� (pg_restore)
echo.   - pg_restore
echo.
echo. 6. mkf ���α׷� �ҽ��� github�� �ø��� (hhryong-hotmail)
echo.
echo. 7. push my_name (���� ����� origin���� ���� �귣ġ Ǫ��)
echo.
echo. 0. ���α׷� ����
echo.

set /p "sel=�޴� ��ȣ�� �Է��ϼ��� : "

rem ---

rem Ư�� ��ɾ� ó��

:: �Է°��� ..���� �����ϴ� ���, �Ϲ� ��ɾ� ����
if "!sel:~0,2!"==".." (
    set "command=!sel:~2!"
    echo.������ ��ɾ�: !command!
    !command!
    echo.
    pause
    goto MENU
)

rem ---

rem  �޴� ���ÿ� ���� �б�

if "%sel%"=="1" goto M1_GitPushMkfpartners
if "%sel%"=="2" goto M2_GitPushHhryongHotmail
if "%sel%"=="3" goto M3_ZipMkf
if "%sel%"=="4" goto M4_PgDump
if "%sel%"=="5" goto M5_PgRestore
if "%sel%"=="6" goto M6_GitPushMkfProgramSources
if "%sel%"=="7" goto M7_GitPushMyBranch
if "%sel%"=="0" goto END_PROGRAM

rem ---

rem ��ȿ���� ���� �Է� ó��

echo.
echo. ��ȿ���� ���� �޴� ��ȣ�Դϴ�. �ٽ� �õ��ϼ���.
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

:: ���� origin�� �ִٸ� ���� (���� �޽��� ����)
git remote remove origin 2>nul
git remote add origin https://github.com/mkfpartners/mkf.git
git branch -M main
echo.github id : MKFpartners�� ����
git push -u origin main

if not errorlevel 0 (
    echo.���� �߻�: Git Push ����. �޽����� Ȯ���ϼ���.
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

:: ���� origin�� �ִٸ� ���� (���� �޽��� ����)
git remote remove origin 2>nul
git remote add origin https://github.com/hhryong-hotmail/mkf.git
git branch -M main
echo.github id : hhryong-hotmail ����
git push -u origin main

if not errorlevel 0 (
    echo.���� �߻�: Git Push ����. �޽����� Ȯ���ϼ���.
)
pause
goto MENU

rem ---

rem 3. mkf 7-zip ����

:M3_ZipMkf
backup.bat
goto MENU

rem ---

rem 4. DB ��� (pg_dump)

:M4_PgDump
d:
echo.db ��� ����...
set "pg_dump_path=c:\Program Files\PostgreSQL\17\bin\"
set "backup_output_dir=d:\Backup\"
set "mkf_repo_backup_dir=d:\mkf\backup\"

:: ���� �ð� ���� (Ŀ�� �޽�����)
set "NOW_DATE=%date:~0,4%-%date:~5,2%-%date:~8,2%"
set "NOW_TIME=%time:~0,2%-%time:~3,2%-%time:~6,2%"

:: ���ϸ� ����� ��¥/�ð� ����
set "date_formatted=!date:~0,4!!date:~5,2!!date:~8,2!"
set "time_raw=!time: =0!"
set "time_formatted=!time_raw:~0,2!!time_raw:~3,2!!time_raw:~6,2!"
set "dump_filename_with_timestamp=mkf_backup.dump.!date_formatted!.!time_formatted!"

"%pg_dump_path%pg_dump.exe" -U postgres -h localhost -p 5432 -d mkf -F c -b -v -f "%backup_output_dir%!dump_filename_with_timestamp!"

if not errorlevel 0 (
    echo.���� �߻�: pg_dump ����.
    pause
    goto MENU
)

echo.��� �Ϸ�: %backup_output_dir%!dump_filename_with_timestamp!

:: mkf repository���� �ֽ� ���� ���� (�����)
copy /Y "%backup_output_dir%!dump_filename_with_timestamp!" "%mkf_repo_backup_dir%mkf_backup.dump"

:: Git�� ��� ���� �߰� �� Ǫ��
cd /d d:\mkf
:: Git 2.35 �̻� �������� �ʿ��� ���� (�� ���� �����ϸ� ��)
:: git config --global --add safe.directory D:/mkf

git add mkf\backup/mkf_backup.dump
git commit -m "DB backup: %NOW_DATE% %NOW_TIME%"

:: �⺻ origin�� Ǫ��
git push origin main

if not errorlevel 0 (
    echo.���� �߻�: Git Push ����. �޽����� Ȯ���ϼ���.
)
pause
goto MENU

rem ---

rem 5. DB ���� �����ޱ� (pg_restore)

:M5_PgRestore
echo.vscode�� DBeaver�� �ߴܽ�Ű����!
pause
cd /d d:\mkf
echo. "��ȣ:"�� �䱸�ϸ� postgres�� ġ����
:: mkf_backup.dump ������ d:\mkf ������ �ִٰ� �����մϴ�.
"c:\Program Files\PostgreSQL\17\bin\pg_restore.exe" --clean -U postgres -h localhost -p 5432 -d mkf mkf_backup.dump

if not errorlevel 0 (
    echo.���� �߻�: pg_restore ����.
    pause
    goto MENU
)
echo.DB ���� �Ϸ�.
pause
goto MENU

rem ---

rem 6. mkf ���α׷� �ҽ��� GitHub�� �ø��� (hhryong-hotmail)

:M6_GitPushMkfProgramSources
d:
cd \mkf
git add .
set "NOW_DATE=%date:~0,4%-%date:~5,2%-%date:~8,2%"
set "NOW_TIME=%time:~0,2%-%time:~3,2%-%time:~6,2%"
git commit -m "Commit (program sources): %NOW_DATE% %NOW_TIME%"

:: ���� origin�� �ִٸ� ���� (���� �޽��� ����)
git remote remove origin 2>nul
git remote add origin https://github.com/hhryong-hotmail/mkf.git
git push -u origin main

if not errorlevel 0 (
    echo.���� �߻�: Git Push ����. �޽����� Ȯ���ϼ���.
)
pause
goto MENU

rem ---

rem 7. Push My Branch (����� ���� �귣ġ Ǫ��)

:M7_GitPushMyBranch
d:
cd \mkf
set /p "branch_name=Ǫ���� �귣ġ �̸��� �Է��ϼ��� (��: my-feature-branch): "
if not defined branch_name (
    echo.�귣ġ �̸��� �Էµ��� �ʾҽ��ϴ�.
    pause
    goto MENU
)
git push origin !branch_name!
if not errorlevel 0 (
    echo.���� �߻�: Git Push ����. �޽����� Ȯ���ϼ���.
)
pause
goto MENU

rem ---

rem 0. ���α׷� ����

:END_PROGRAM
echo. ���α׷��� �����մϴ�.
:: mkf.bat ������ ���� ����Ǵ� ��ġ�� �־�� ��.
if exist ".\mkf.bat" (
    copy /Y ".\mkf.bat" "d:\mkf\data\"
    echo.mkf.bat ������ d:\mkf\data�� ����Ǿ����ϴ�.
) else (
    echo.mkf.bat ������ ã�� �� ���� �������� ���߽��ϴ�.
)
pause
exit /b