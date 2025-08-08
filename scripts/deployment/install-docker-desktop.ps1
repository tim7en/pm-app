# Docker Desktop Installation Script for Windows
# Run this script as Administrator in PowerShell

Write-Host "Installing Docker Desktop for Windows..." -ForegroundColor Green

# Download URL for Docker Desktop
$dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
$dockerInstaller = "$env:TEMP\DockerDesktopInstaller.exe"

try {
    # Download Docker Desktop installer
    Write-Host "Downloading Docker Desktop installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $dockerUrl -OutFile $dockerInstaller -UseBasicParsing
    
    # Run the installer
    Write-Host "Running Docker Desktop installer..." -ForegroundColor Yellow
    Start-Process -FilePath $dockerInstaller -Wait
    
    Write-Host "Docker Desktop installation completed!" -ForegroundColor Green
    Write-Host "Please restart your computer and start Docker Desktop from the Start Menu." -ForegroundColor Yellow
    Write-Host "After restart, come back and run: docker --version" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error downloading or installing Docker Desktop: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please manually download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
}

# Clean up
if (Test-Path $dockerInstaller) {
    Remove-Item $dockerInstaller -Force
}
