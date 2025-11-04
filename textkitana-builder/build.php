<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$projectFile = __DIR__ . '/package/kitana-project.php2exe';
$iniFile = __DIR__ . '/package/exebuild.ini';
$batFile = __DIR__ . '/package/exebuild.bat';
$launcher = __DIR__ . '/package/ollama-launcher.bat';
$postBuild = __DIR__ . '/package/post-build-hook.php';
$readme = __DIR__ . '/package/README-packaging.md';

$files = [
    $projectFile => <<<'PHP2EXE'
[Application]
Name=Kitana Builder
Version=1.0.0
Company=Offline Forge
MainScript=index.php
Icon=index.php
EnableInternalWebServer=1
WebServerPort=0
DefaultDocument=index.php
UseWebview2=1
EnableCompression=1
CompressionMethod=ZSTD
EmbedAllAssets=1
EnableSandbox=1

[PHP]
Version=8.1
EnableOpcache=1
Extensions=php_sqlite3.dll;php_curl.dll;php_zip.dll
AllowUrlFopen=0
AllowUrlInclude=0
ExposePhp=0

[Security]
EncryptData=1
EncryptSources=1
EnableDebug=0

[Files]
Sources=textkitana-builder
IncludeFold=textkitana-builder\assets
IncludeFold=textkitana-builder\api
IncludeFold=textkitana-builder\builder
IncludeFold=textkitana-builder\includes
IncludeFold=textkitana-builder\docs
IncludeFile=textkitana-builder\config.php
IncludeFile=textkitana-builder\install.php
IncludeFile=textkitana-builder\.htaccess

[Runtime]
RunProgram=php.exe -S 127.0.0.1:0 -t .
LaunchWait=3000
CustomPostRun=ollama-launcher.bat

PHP2EXE,
    $iniFile => <<<'INI'
[ExeOutput]
Project=file:kitana-project.php2exe
Output=kitana-builder.exe
RunPostBuild=post-build-hook.php
DisplayGui=1
Icon=..
INI,
    $batFile => <<<'BAT'
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
BAT,
    $launcher => <<<'BAT'
@echo off
REM Ensure Ollama is running when the packaged app starts
for /f "tokens=*" %%S in ('sc query "Ollama" ^| findstr /i "STATE"') do set SERVICE_LINE=%%S
echo %SERVICE_LINE% | findstr /i "running" >nul
if errorlevel 1 (
  start "Ollama" /min "C:\\Program Files\\Ollama\\ollama.exe" serve
  timeout /t 5 >nul
)
exit /b 0
BAT,
    $postBuild => <<<'PHP'
<?php
declare(strict_types=1);

$base = dirname(__DIR__);
$cache = $base . '/tmp';
if (is_dir($cache)) {
    $objects = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($cache, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($objects as $object) {
        if ($object->isFile()) {
            @unlink($object->getPathname());
        } elseif ($object->isDir()) {
            @rmdir($object->getPathname());
        }
    }
    @rmdir($cache);
}

file_put_contents($base . '/package/build.log', '[' . date('c') . "] Packaged successfully\n", FILE_APPEND);
PHP,
    $readme => <<<'MD'
# Kitana Builder Packaging

## Prerequisites

- ExeOutput for PHP 2025.0 (WebView2 engine, PHP 8.1 runtime)
- Ollama installed with `codellama` and `llama3.2` models available
- Windows 10/11 with WebView2 runtime

## Steps

1. Run `php build.php` to generate the ExeOutput project and helpers.
2. Open `package/exebuild.bat` to launch ExeOutput with the project preloaded.
3. Verify settings:
   - Engine: WebView2
   - Compression: ZSTD, encryption enabled
   - PHP extensions: sqlite3, curl, zip
4. Build to produce `kitana-builder.exe` (typical size 20–50 MB).
5. Bundle `ollama-launcher.bat` with the executable to auto-start Ollama.

## Post Build

- The post-build hook cleans temporary directories and appends to `package/build.log`.
- Distribute the executable with instructions to install and start Ollama locally.
MD,
];

foreach ($files as $path => $contents) {
    file_put_contents($path, $contents);
}

echo "ExeOutput project files refreshed." . PHP_EOL;
