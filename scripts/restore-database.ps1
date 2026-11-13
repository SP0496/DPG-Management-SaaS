# ==============================================================================
# PG-Management-SaaS PostgreSQL Database Restore Script
# Restores database from a custom-format (.dump) or plain SQL (.sql) backup file
# ==============================================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$ContainerName = "pg_management_postgres",
    [string]$DbName = "pg_management_db",
    [string]$DbUser = "pgmanagement"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file [$BackupFile] does not exist."
}

$fileItem = Get-Item $BackupFile
$fileName = $fileItem.Name

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Restoring PostgreSQL Database [$DbName] on [$ContainerName]" -ForegroundColor Cyan
Write-Host " Source: $BackupFile" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check container running
$running = docker ps --filter "name=$ContainerName" --filter "status=running" -q
if (-not $running) {
    Write-Error "Container [$ContainerName] is not running. Please start it with 'docker compose up -d' first."
}

docker cp "$BackupFile" "${ContainerName}:/tmp/$fileName"

try {
    if ($fileName.EndsWith(".dump")) {
        Write-Host "--> Restoring from custom format archive with pg_restore..." -ForegroundColor Yellow
        docker exec $ContainerName pg_restore -U $DbUser -d $DbName --clean --if-exists -v "/tmp/$fileName"
    } elseif ($fileName.EndsWith(".sql")) {
        Write-Host "--> Restoring from plain SQL dump with psql..." -ForegroundColor Yellow
        docker exec $ContainerName psql -U $DbUser -d $DbName -f "/tmp/$fileName"
    } else {
        Write-Error "Unsupported file format. Please supply a .dump or .sql file."
    }
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " Restore Completed Successfully!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} finally {
    docker exec $ContainerName rm -f "/tmp/$fileName"
}
