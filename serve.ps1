# PowerShell Multi-Device Server for Dr. Mahmoud Ghanema Clinic
# Supports Local Wi-Fi (0.0.0.0) + Cloudflare Mobile HTTPS Tunnel

param(
    [int]$Port = 8080
)

$folder = $PSScriptRoot
$cloudflaredPath = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cloudflaredPath)) {
    $cloudflaredPath = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
}

# Find local Wi-Fi / LAN IPv4 address
$localIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*", "Ethernet*" -ErrorAction SilentlyContinue | 
            Where-Object { $_.IPAddress -notlike "169.*" -and $_.IPAddress -notlike "127.*" } | 
            Select-Object -First 1).IPAddress
if (-not $localIp) { $localIp = "127.0.0.1" }

$localUrl = "http://localhost:$Port"
$wifiUrl = "http://${localIp}:$Port"

# Clean up any previous orphaned cloudflared processes before starting
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Start Cloudflare Tunnel in background for instant secure Mobile HTTPS URL
$tunnelUrl = $null
$tunnelProcess = $null

if ($cloudflaredPath -and (Test-Path $cloudflaredPath)) {
    Write-Host "جاري تجهيز الرابط الآمن المخصص للموبايل (Cloudflare Tunnel)..." -ForegroundColor Cyan
    $tunnelLogFile = Join-Path $env:TEMP "dr_ghanema_tunnel.log"
    if (Test-Path $tunnelLogFile) { Remove-Item $tunnelLogFile -Force }

    $tunnelProcess = Start-Process -FilePath $cloudflaredPath -ArgumentList "tunnel --url http://localhost:$Port" -RedirectStandardError $tunnelLogFile -PassThru -WindowStyle Hidden

    # Wait up to 12 seconds for the trycloudflare.com URL to appear in log
    for ($i = 0; $i -lt 24; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-Path $tunnelLogFile) {
            $content = Get-Content $tunnelLogFile -Raw -ErrorAction SilentlyContinue
            if ($content -match '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)') {
                $tunnelUrl = $matches[1]
                break
            }
        }
    }
}

# Save active URLs to JSON for frontend QR code and mobile connect modal
$urlsObj = @{
    tunnelUrl = $tunnelUrl
    wifiUrl   = $wifiUrl
    localUrl  = $localUrl
}
$urlsJson = $urlsObj | ConvertTo-Json
Set-Content -Path (Join-Path $folder "active-urls.json") -Value $urlsJson -Encoding UTF8

# Console Display Banner
Clear-Host
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "      عيادة د. محمود غنيمة - استشاري ومدرس الروماتيزم والمناعة" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  💻 [1] للتشغيل على هذا اللابتوب:" -ForegroundColor White
Write-Host "      $localUrl" -ForegroundColor Yellow
Write-Host ""

if ($tunnelUrl) {
    Write-Host "  📱 [2] الرابط الأفضل للموبايل والتابلت (آمن 100% ويدعم الكاميرا من أي مكان):" -ForegroundColor White
    Write-Host "      $tunnelUrl" -ForegroundColor Green
    Write-Host "      (امسح كود QR الظاهر في شاشة اللابتوب أو افتح هذا الرابط مباشرة)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "  📶 [3] رابط الموبايل عبر شبكة الواي فاي المحلية:" -ForegroundColor White
Write-Host "      $wifiUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  💡 نصيحة: اترك هذه النافذة مفتوحة طالما أنك تستخدم السيستم." -ForegroundColor Gray
Write-Host "  اضغط Ctrl + C لإيقاف التشغيل في أي وقت." -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Open laptop browser automatically
Start-Process $localUrl

# MIME Types Dictionary
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".json" = "application/json; charset=utf-8"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
}

# Start TCP Listener bound to 0.0.0.0 (all interfaces) - no admin required
$tcpListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
try {
    $tcpListener.Start(100)
} catch {
    Write-Host "فشل بدء المنفذ $Port : $($_.Exception.Message)" -ForegroundColor Red
    return
}

try {
    while ($true) {
        $client = $null
        try {
            $client = $tcpListener.AcceptTcpClient()
            $client.ReceiveTimeout = 4000
            $client.SendTimeout = 4000
        } catch {
            Start-Sleep -Milliseconds 50
            continue
        }

        try {
            $stream = $client.GetStream()
            $buffer = New-Object byte[] 8192
            $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
            if ($bytesRead -gt 0) {
                $reqStr = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $bytesRead)
                $firstLine = ($reqStr -split "`r`n")[0]
                $parts = $firstLine -split " "

                if ($parts.Length -ge 2) {
                    $method = $parts[0].ToUpper()
                    $rawPath = $parts[1].Split('?')[0].TrimStart('/')
                    if ([string]::IsNullOrWhiteSpace($rawPath)) { $rawPath = "index.html" }

                    if ($method -eq "OPTIONS") {
                        $optHeader = "HTTP/1.1 204 No Content`r`n" +
                                     "Access-Control-Allow-Origin: *`r`n" +
                                     "Access-Control-Allow-Methods: GET, POST, OPTIONS`r`n" +
                                     "Access-Control-Allow-Headers: *`r`n" +
                                     "Connection: close`r`n`r`n"
                        $optBytes = [System.Text.Encoding]::ASCII.GetBytes($optHeader)
                        $stream.Write($optBytes, 0, $optBytes.Length)
                        $stream.Flush()
                    } else {
                        # Map file path and prevent directory traversal
                        $safeRelPath = $rawPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
                        $targetFile = Join-Path $folder $safeRelPath

                        if (Test-Path $targetFile -PathType Leaf) {
                            $ext = [System.IO.Path]::GetExtension($targetFile).ToLower()
                            $cType = $mimeTypes[$ext]
                            if (-not $cType) { $cType = "application/octet-stream" }

                            $fileBytes = [System.IO.File]::ReadAllBytes($targetFile)
                            $header = "HTTP/1.1 200 OK`r`n" +
                                      "Content-Type: $cType`r`n" +
                                      "Content-Length: $($fileBytes.Length)`r`n" +
                                      "Access-Control-Allow-Origin: *`r`n" +
                                      "Connection: close`r`n`r`n"
                            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                            $stream.Write($headerBytes, 0, $headerBytes.Length)
                            $stream.Write($fileBytes, 0, $fileBytes.Length)
                            $stream.Flush()
                        } else {
                            $notFoundBody = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                            $header = "HTTP/1.1 404 Not Found`r`n" +
                                      "Content-Type: text/plain; charset=utf-8`r`n" +
                                      "Content-Length: $($notFoundBody.Length)`r`n" +
                                      "Access-Control-Allow-Origin: *`r`n" +
                                      "Connection: close`r`n`r`n"
                            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                            $stream.Write($headerBytes, 0, $headerBytes.Length)
                            $stream.Write($notFoundBody, 0, $notFoundBody.Length)
                            $stream.Flush()
                        }
                    }
                }
            }
        } catch {
            # Client closed connection prematurely
        } finally {
            $client.Close()
        }
    }
} finally {
    $tcpListener.Stop()
    if ($tunnelProcess -and -not $tunnelProcess.HasExited) {
        Stop-Process -Id $tunnelProcess.Id -Force -ErrorAction SilentlyContinue
    }
}
