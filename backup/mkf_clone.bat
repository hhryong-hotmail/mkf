@echo off
setlocal

set "REPO_PATH=D:\MKF"
set "REPO_URL=https://github.com/hhryong-hotmail/mkf.git"
set "COMMIT_MESSAGE=Automated commit on %date:~0,4%-%date:~5,2%-%date:~8,2% %time:~0,2%:%time:~3,2%"

echo Navigating to %REPO_PATH%...
cd /d "%REPO_PATH%"
if %errorlevel% neq 0 (
    echo Error: Failed to navigate to %REPO_PATH%. Check if the path exists.
    pause
    exit /b 1
)

if not exist ".git" (
    echo --- Initializing new Git repository ---
    echo Running: git init
    git init
    if %errorlevel% neq 0 (
        echo Error: Failed to initialize Git repository.
        pause
        exit /b 1
    )
    echo Running: git branch -M main
    git branch -M main
    if %errorlevel% neq 0 (
        echo Error: Failed to set initial branch to main.
        pause
        exit /b 1
    )
    echo Running: git remote add origin "%REPO_URL%"
    git remote add origin "%REPO_URL%"
    if %errorlevel% neq 0 (
        echo Error: Failed to add remote origin.
        pause
        exit /b 1
    )
    echo Repository initialized and remote added.
    echo ---------------------------------------
)

echo Adding all changes...
echo Running: git add .
git add .
if %errorlevel% neq 0 (
    echo Error: Failed to add files to staging area.
    pause
    exit /b 1
)

echo Committing changes...
echo Running: git commit -m "%COMMIT_MESSAGE%"
git commit -m "%COMMIT_MESSAGE%"
REM Check if there was nothing to commit (this isn't an error, just an info message)
findstr /C:"nothing to commit" /C:"nothing added to commit" nul > nul
if %errorlevel% equ 0 (
    echo No new changes to commit.
) else if %errorlevel% neq 0 (
    echo Error: Failed to commit changes.
    pause
    exit /b 1
)


echo Pushing to GitHub...
echo Running: git push -u origin main
git push -u origin main
if %errorlevel% equ 0 (
    echo Successfully pushed to GitHub.
) else (
    echo Error: Failed to push to GitHub. Please check your internet connection, Git credentials, or if your local branch is behind the remote.
    pause
    exit /b 1
)

echo Task completed.
pause
endlocal