$ErrorActionPreference = 'Stop'

$RootDir = Split-Path -Parent $PSScriptRoot
$MobileDir = Join-Path $RootDir 'mobile'
$GoogleServicesMobile = Join-Path $MobileDir 'google-services.json'

if (-not (Test-Path $GoogleServicesMobile)) {
  Write-Error "Missing mobile\google-services.json. Download it from Firebase Console -> Project Settings -> Android app (com.pgmanagement.saas) and place it at $GoogleServicesMobile."
}

$SdkPlatformTools = "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
if (Test-Path $SdkPlatformTools) {
  $env:Path = "$SdkPlatformTools;$env:Path"
}

$AndroidHome = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $AndroidHome) {
  $env:ANDROID_HOME = $AndroidHome
}

Push-Location $MobileDir
try {
  Write-Host "Running Expo Android prebuild..." -ForegroundColor Cyan
  npx expo prebuild --platform android
  Write-Host "Building and running Android development client..." -ForegroundColor Cyan
  npx expo run:android
} finally {
  Pop-Location
}
