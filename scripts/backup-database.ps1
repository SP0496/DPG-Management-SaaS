# ==============================================================================
# PG-Management-SaaS PostgreSQL Database Backup Script
# Generates both custom-format archive (.dump) and plain SQL dump (.sql)
# ==============================================================================

param(
    [string]$ContainerName = "pg_management_postgres",
    [string]$DbName = "pg_management_db",
    [string]$DbUser = "pgmanagement",
    [string]$OutputDir = "$PSScriptRoot\..\backups"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFileName = "${DbName}_${timestamp}.dump"
$sqlFileName = "${DbName}_${timestamp}.sql"

$hostDumpPath = Join-Path $OutputDir $dumpFileName
$hostSqlPath = Join-Path $OutputDir $sqlFileName

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting PostgreSQL Backup for [$DbName] on [$ContainerName]" -ForegroundColor Cyan
Write-Host " Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check container running
$running = docker ps --filter "name=$ContainerName" --filter "status=running" -q
if (-not $running) {
    Write-Error "Container [$ContainerName] is not running. Please start it with 'docker compose up -d' first."
}

# 1. Custom format binary archive (pg_restore compatible, compressed)
Write-Host "--> Creating custom format backup ($dumpFileName)..." -ForegroundColor Yellow
docker exec $ContainerName pg_dump -U $DbUser -d $DbName -F c -b -f "/tmp/$dumpFileName"
docker cp "${ContainerName}:/tmp/$dumpFileName" "$hostDumpPath"
docker exec $ContainerName rm -f "/tmp/$dumpFileName"

# 2. Plain SQL dump (readable, includes DROP/CREATE DB)
Write-Host "--> Creating plain SQL backup ($sqlFileName)..." -ForegroundColor Yellow
docker exec $ContainerName pg_dump -U $DbUser -d $DbName --clean --if-exists --create -f "/tmp/$sqlFileName"
docker cp "${ContainerName}:/tmp/$sqlFileName" "$hostSqlPath"
docker exec $ContainerName rm -f "/tmp/$sqlFileName"

# Verify outputs
$dumpItem = Get-Item $hostDumpPath
$sqlItem = Get-Item $hostSqlPath

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Backup Completed Successfully!" -ForegroundColor Green
Write-Host " 1. Archive: $hostDumpPath ($([math]::Round($dumpItem.Length / 1KB, 2)) KB)" -ForegroundColor Green
Write-Host " 2. SQL Dump: $hostSqlPath ($([math]::Round($sqlItem.Length / 1KB, 2)) KB)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
