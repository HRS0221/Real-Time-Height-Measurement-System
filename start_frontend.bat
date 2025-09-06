@echo off
echo 🚀 Starting Height Detection System Frontend...
echo 📍 Frontend will be available at: http://localhost:3000
echo.
echo Installing dependencies...
cd frontend

echo Attempting to install with legacy peer deps...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo.
    echo Trying with force flag...
    call npm install --force
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        echo.
        echo Try running these commands manually:
        echo   cd frontend
        echo   npm install --legacy-peer-deps
        echo   npm start
        pause
        exit /b 1
    )
)

echo.
echo ✅ Dependencies installed successfully!
echo Starting React development server...
call npm start
