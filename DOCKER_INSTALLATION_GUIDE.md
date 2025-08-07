# 🐳 Docker Installation Guide for Windows

## **Method 1: Download Docker Desktop (Recommended)**

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Click "Download for Windows"
   - Download the installer (Docker Desktop Installer.exe)

2. **Install Docker Desktop:**
   - Run the downloaded installer
   - Follow the installation wizard
   - **Important**: Enable WSL 2 integration when prompted
   - Restart your computer when installation completes

3. **Verify Installation:**
   - Open new PowerShell/Command Prompt
   - Run: `docker --version`
   - Run: `docker-compose --version`

## **Method 2: Using Chocolatey (if available)**

```powershell
# Install Chocolatey first (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Docker Desktop
choco install docker-desktop
```

## **Method 3: Manual Installation Steps**

1. **Enable WSL 2 (Required for Docker Desktop):**
   ```powershell
   # Run as Administrator
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   
   # Restart computer, then:
   wsl --set-default-version 2
   ```

2. **Download and Install:**
   - Download from: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
   - Run installer with administrator privileges
   - Select "Use WSL 2 instead of Hyper-V"

## **After Installation:**

1. **Start Docker Desktop**
   - Launch Docker Desktop from Start menu
   - Wait for Docker Engine to start (green status)

2. **Test Docker:**
   ```powershell
   docker --version
   docker run hello-world
   ```

## **System Requirements:**
- Windows 10/11 (64-bit)
- WSL 2 feature enabled
- Hardware virtualization enabled in BIOS
- At least 4GB RAM
- At least 2GB free disk space

---

**Once Docker is installed, we'll proceed to build and run your PM App!**
