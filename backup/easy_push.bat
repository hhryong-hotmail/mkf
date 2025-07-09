@echo off
title Easy Push to hhryong-hotmail

:: 1. 커밋 메시지 확인
if "%~1"=="" (
    echo 오류: 커밋 메시지를 입력해주세요.
    echo 사용법: %~nx0 "여기에 커밋 메시지"
    pause
    exit /b
)

set "COMMIT_MSG=%~1"

:: 2. 작업 디렉토리로 이동
echo --- D:\mkf 로 이동 중 ---
cd /d "D:\mkf"
if not exist .git (
    echo 오류: D:\mkf 폴더가 Git 저장소가 아닙니다.
    pause
    exit /b
)

:: 3. 모든 변경사항 추가
echo.
echo --- 모든 변경사항 스테이징 중 (git add .) ---
git add .

:: 4. 변경사항 커밋
echo.
echo --- 변경사항 커밋 중 ---
git commit -m "%COMMIT_MSG%"

:: 5. hhryong-hotmail 저장소로 푸시
echo.
echo --- hhryong-hotmail 저장소로 푸시 중 ---
git push hhryong main

echo.
echo =================================================
echo  푸시 완료! GitHub Action이 파트너 저장소로 동기화합니다.
echo =================================================
pause
