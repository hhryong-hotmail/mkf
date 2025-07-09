@echo off
REM Git 리포지토리 경로를 설정합니다.
REM D 드라이브가 있으면 D:\ 경로를 사용하고, 없으면 C:\ 경로를 사용합니다.
ECHO mkf 소스를 다운 받습니다

SET REPO_BASE_PATH="\mkf" REM <-- 이 부분을 실제 사용자 경로로 변경하세요.

IF EXIST "D:\" (
    SET REPO_PATH="D:%REPO_BASE_PATH%"
    echo D 드라이브가 감지되었습니다. D:%REPO_BASE_PATH% 경로를 사용합니다.
) ELSE (
    SET REPO_PATH="C:%REPO_BASE_PATH%"
    echo D 드라이브를 찾을 수 없습니다. C:%REPO_BASE_PATH% 경로를 사용합니다.
)

REM Git 설치 경로가 시스템 PATH에 없으면 아래 줄의 주석을 해제하고 Git 실행 파일의 전체 경로를 지정하세요.
REM SET PATH="C:\Program Files\Git\bin";%PATH%

echo %REPO_PATH% 경로에서 Git Pull을 시작합니다...
cd /d %REPO_PATH%
git pull main

echo.
echo mkf 소스 다운 작업을 완료했습니다.
pause

rem mkf database 작업
echo mkf DB 다운 작업을 시작합니다
echo.vscode와 DBeaver를 중단시키세요!
pause
@echo off
chcp 65001 > nul

:: =====================================================================
:: MKFpartners/backup.git 에서 mkf_backup.dump 파일을 다운로드하고
:: pg_restore를 사용하여 PostgreSQL 데이터베이스로 복원하는 스크립트
:: =====================================================================

:: 사용자 정의 설정 ----------------------------------------------------
set "GITHUB_REPO_URL=https://github.com/MKFpartners/backup.git"
set "DUMP_FILE_NAME=mkf_backup.dump"
set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_USER=your_db_user"         :: 실제 PostgreSQL 사용자 이름으로 변경하세요
set "DB_NAME=your_database_name"   :: 복원할 데이터베이스 이름으로 변경하세요
set "PG_RESTORE_PATH=C:\Program Files\PostgreSQL\16\bin\pg_restore.exe" :: pg_restore의 실제 경로로 변경하세요 (PostgreSQL 버전에 따라 다름)
:: --------------------------------------------------------------------


:: 덤프 파일을 다운로드할 기본 경로 설정
set "DOWNLOAD_BASE_DIR="

:: D: 드라이브 존재 여부 확인
if exist D:\ (
    set "DOWNLOAD_BASE_DIR=D:\"
) else (
    set "DOWNLOAD_BASE_DIR=C:\"
)

set "DOWNLOAD_DIR=%DOWNLOAD_BASE_DIR%MKF_Backup_Temp"
set "DUMP_FILE_PATH=%DOWNLOAD_DIR%\%DUMP_FILE_NAME%"

echo.
echo =========================================================
echo  MKF Backup Restore Script
echo =========================================================
echo.
echo 덤프 파일 다운로드 경로: %DOWNLOAD_DIR%
echo 복원 대상 데이터베이스: %DB_NAME% (호스트: %DB_HOST%, 사용자: %DB_USER%)
echo.

:: 임시 다운로드 디렉토리 생성
echo 임시 디렉토리 생성 중: %DOWNLOAD_DIR%
if not exist "%DOWNLOAD_DIR%" (
    mkdir "%DOWNLOAD_DIR%"
    if errorlevel 1 (
        echo 오류: 임시 디렉토리를 생성할 수 없습니다.
        goto :eof
    )
) else (
    echo 임시 디렉토리가 이미 존재합니다. 내용을 삭제합니다.
    rmdir /s /q "%DOWNLOAD_DIR%" > nul
    mkdir "%DOWNLOAD_DIR%"
    if errorlevel 1 (
        echo 오류: 기존 임시 디렉토리를 정리하거나 재생성할 수 없습니다.
        goto :eof
    )
)


:: GitHub 저장소 클론 및 덤프 파일 다운로드
echo.
echo GitHub 저장소 (%GITHUB_REPO_URL%) 클론 중...
cd "%DOWNLOAD_DIR%"
git init
if errorlevel 1 (
    echo 오류: Git 초기화에 실패했습니다. Git이 설치되어 있고 PATH에 추가되었는지 확인하십시오.
    goto :eof
)
git remote add origin %GITHUB_REPO_URL%
if errorlevel 1 (
    echo 오류: Git 원격 저장소 추가에 실패했습니다.
    goto :eof
)
:: 특정 파일만 다운로드하기 위해 sparse-checkout 사용
git config core.sparsecheckout true
echo %DUMP_FILE_NAME% > .git/info/sparse-checkout
git pull origin main --depth=1 --no-checkout
if errorlevel 1 (
    echo 오류: Git 풀에 실패했습니다. 저장소 URL과 접근 권한을 확인하십시오.
    goto :eof
)
git checkout main %DUMP_FILE_NAME%
if errorlevel 1 (
    echo 오류: 덤프 파일을 체크아웃하는 데 실패했습니다. 파일 이름 또는 브랜치를 확인하십시오.
    goto :eof
)
echo 덤프 파일 다운로드 완료: %DUMP_FILE_PATH%


:: PostgreSQL 데이터베이스 복원
echo.
echo PostgreSQL 데이터베이스 (%DB_NAME%) 복원 시작...
echo.
:: pg_restore 명령 실행
:: --clean: 복원 전 데이터베이스 객체를 삭제합니다. (주의: 기존 데이터가 삭제됩니다!)
:: --create: 복원 전 데이터베이스를 생성합니다. (데이터베이스가 없으면 자동으로 생성)
:: -d: 대상 데이터베이스 이름
:: -h: 데이터베이스 호스트
:: -p: 데이터베이스 포트
:: -U: 데이터베이스 사용자 이름
:: -Fc: 사용자 정의 형식 아카이브 (덤프 파일이 이 형식으로 생성되었다고 가정)

:: pg_restore 실행 전에 사용자에게 암호를 묻도록 하려면 환경 변수 PGPASSWORD를 설정하지 마십시오.
:: 배치 파일 내에서 PGPASSWORD를 설정하는 것은 보안상 권장되지 않습니다.
:: 테스트 목적으로만 사용하고 실제 운영 환경에서는 사용하지 마십시오.
:: set PGPASSWORD=your_db_password

if not exist "%PG_RESTORE_PATH%" (
    echo 오류: pg_restore.exe를 찾을 수 없습니다. 경로를 다시 확인하십시오: %PG_RESTORE_PATH%
    goto :eof
)

"%PG_RESTORE_PATH%" --host=%DB_HOST% --port=%DB_PORT% --username=%DB_USER% --dbname=%DB_NAME% --clean --create "%DUMP_FILE_PATH%"
:: --clean 옵션을 사용할 경우, 해당 데이터베이스의 기존 모든 객체가 삭제됩니다.
:: 주의해서 사용하십시오. 기존 데이터를 유지하려면 --clean 옵션을 제거하십시오.

if errorlevel 0 (
    echo.
    echo =========================================================
    echo  데이터베이스 복원 성공!
    echo =========================================================
) else (
    echo.
    echo =========================================================
    echo  오류: 데이터베이스 복원 실패. 위의 메시지를 확인하십시오.
    echo =========================================================
)

:: 임시 파일 및 디렉토리 정리
echo.
echo 임시 다운로드 디렉토리 (%DOWNLOAD_DIR%) 정리 중...
cd /d "%~dp0" :: 스크립트가 실행된 원래 디렉토리로 돌아갑니다.
rmdir /s /q "%DOWNLOAD_DIR%"
if errorlevel 0 (
    echo 임시 디렉토리 정리 완료.
) else (
    echo 오류: 임시 디렉토리 정리에 실패했습니다. 수동으로 삭제하십시오.
)

echo.
echo 스크립트 실행 완료.
pause