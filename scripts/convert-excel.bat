@echo off
chcp 65001 >nul
echo ========================================
echo UCS展车数据转换工具
echo ========================================
echo.

set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..

if not exist "%PROJECT_DIR%\data\展车列表.xlsx" (
    echo ⚠️ 未找到展车列表文件！
    echo    请将展车列表 Excel 放到 data\展车列表.xlsx
    pause
    exit /b 1
)

if not exist "%PROJECT_DIR%\data\门店信息.xlsx" (
    echo ⚠️ 未找到门店信息文件！
    echo    请将门店信息 Excel 放到 data\门店信息.xlsx
    pause
    exit /b 1
)

cd /d "%PROJECT_DIR%"

if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    npm install
)

echo 🔄 正在转换 Excel 数据...
node scripts\convert-excel.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ 转换失败，请检查错误信息
    pause
    exit /b 1
)

echo.
echo 🚀 是否立即推送到 GitHub？
choice /c YN /n /m "按 Y 推送，按 N 跳过: "
if %errorlevel% equ 1 (
    git add .
    git commit -m "更新展车数据：%date%"
    git push
    echo.
    echo ✅ 推送完成！Cloudflare Pages 将自动重新部署
)

echo.
pause
