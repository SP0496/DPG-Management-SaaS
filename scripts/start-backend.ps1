
$ErrorActionPreference = 'Stop'

$RootDir = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $RootDir '.env'
$SecretsDir = Join-Path $RootDir 'secrets'
$GoogleServicesMobile = Join-Path $RootDir 'mobile\google-services.json'

# Java 17
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.21.9-hotspot'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

# Maven
$MvnCmd = 'C:\Tools\apache-maven-3.10.0\bin\mvn.cmd'

if (-not (Test-Path $env:JAVA_HOME)) {
    throw "Java 17 not found."
}

if (-not (Test-Path $MvnCmd)) {
    throw "Maven not found."
}

if (-not (Test-Path $EnvFile)) {
    throw "Missing .env file."
}

# Load environment variables
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()

    if (-not $line -or $line.StartsWith('#')) {
        return
    }

    $parts = $line.Split('=', 2)

    if ($parts.Length -eq 2) {
        [Environment]::SetEnvironmentVariable(
            $parts[0].Trim(),
            $parts[1].Trim(),
            'Process'
        )
    }
}

# Validate secrets
foreach ($varName in @('DB_PASSWORD', 'JWT_SECRET')) {
    $val = [Environment]::GetEnvironmentVariable($varName, 'Process')

    if ([string]::IsNullOrWhiteSpace($val)) {
        throw "$varName is missing in .env"
    }
}

if (-not (Test-Path $GoogleServicesMobile)) {
    Write-Warning "google-services.json not found."
}

# Start PostgreSQL
Write-Host "Starting PostgreSQL..." -ForegroundColor Cyan

docker compose --env-file $EnvFile -f (Join-Path $RootDir 'infra\docker-compose.yml') up -d postgres

if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL startup failed."
}

# Verify versions
Write-Host "Java and Maven versions:" -ForegroundColor Cyan
java -version
& $MvnCmd -version

# Start backend
Write-Host "Starting Spring Boot on port $($env:SERVER_PORT)..." -ForegroundColor Cyan

& $MvnCmd -f (Join-Path $RootDir 'backend\pom.xml') spring-boot:run
