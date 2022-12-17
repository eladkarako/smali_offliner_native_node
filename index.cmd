@echo off
chcp 65001 1>nul 2>nul
set "LANG=en_US.UTF-8"
set "LANGUAGE=en_US"
set "LC_CTYPE=en_US.UTF-8"
set "LC_NUMERIC=en_US.UTF-8"
set "LC_TIME=en_US.UTF-8"
set "LC_COLLATE=en_US.UTF-8"
set "LC_MONETARY=en_US.UTF-8"
set "LC_MESSAGES=en_US.UTF-8"
set "LC_PAPER=en_US.UTF-8"
set "LC_NAME=en_US.UTF-8"
set "LC_ADDRESS=en_US.UTF-8"
set "LC_TELEPHONE=en_US.UTF-8"
set "LC_MEASUREMENT=en_US.UTF-8"
set "LC_IDENTIFICATION=en_US.UTF-8"
set "LC_ALL=en_US.UTF-8"


pushd "%~sdp0"

echo [INFO] "node.exe" "index.js" %*
"node.exe" "index.js" %*
set "EXIT_CODE=%ErrorLevel%"

popd
::pause
exit /b %EXIT_CODE%
