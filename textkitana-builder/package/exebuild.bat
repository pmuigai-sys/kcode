@echo off
REM Launch ExeOutput project
setlocal
cd /d "%~dp0"
if not exist kitana-project.php2exe (
  echo Project file missing. Run build.php first.
  pause
  exit /b 1
)
"%ProgramFiles%\ExeOutput for PHP\ExeOutputCompiler.exe" kitana-project.php2exe
