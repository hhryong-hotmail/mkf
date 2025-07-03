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