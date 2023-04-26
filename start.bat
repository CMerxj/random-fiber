@echo off
echo Welcome to the Fiber-Visualization
echo currentTime: %time%


echo. 


echo. 

echo.
echo **************  INPUT  ********************
echo Input 1: Run the current project [default]
echo Input 2: Package the current project
echo Input 3: Install dependencies
echo Please enter 1 or 2 or 3

REM 等待输入
set/p option=

echo.

REM 默认值
if "%option%"=="" set option=1

echo Your choice is: %option%

echo.

REM 直接部署 默认值
if "%option%"=="1" echo Building, please wait... && echo. && npm run dev
REM 构建打包 输出生产环境
if "%option%"=="2" echo Packing, please wait... && echo. && npm run build
REM 安装
if "%option%"=="3" echo Installing, please wait && echo. && npm install

echo.


echo   ####   ####   ####  #####  #####  #   # ###### 
echo  #    # #    # #    # #    # #    #  # #  #      
echo  #      #    # #    # #    # #####    #   #####  
echo  #  ### #    # #    # #    # #    #   #   #      
echo  #    # #    # #    # #    # #    #   #   #      
echo   ####   ####   ####  #####  #####    #   ###### 

echo.

pause

