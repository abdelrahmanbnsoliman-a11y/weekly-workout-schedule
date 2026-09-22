# Rebuilds "Weekly Workout Schedule.exe" from index.original.html + the progress.* files.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path "wv2\lib\net462\Microsoft.Web.WebView2.Core.dll")) {
  Write-Host "Downloading WebView2 SDK from NuGet..."
  Invoke-WebRequest "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2" -OutFile wv2.zip
  Expand-Archive wv2.zip -DestinationPath wv2 -Force
}
if (-not (Test-Path "app.ico")) { powershell -ExecutionPolicy Bypass -File make-icon.ps1 }
python patch.py
$lib = "wv2\lib\net462"
& "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /target:winexe /platform:x64 /optimize+ `
  "/out:..\Weekly Workout Schedule.exe" /win32icon:app.ico `
  /r:System.Windows.Forms.dll /r:System.Drawing.dll `
  "/r:$lib\Microsoft.Web.WebView2.Core.dll" "/r:$lib\Microsoft.Web.WebView2.WinForms.dll" `
  "/resource:$lib\Microsoft.Web.WebView2.Core.dll,Microsoft.Web.WebView2.Core.dll" `
  "/resource:$lib\Microsoft.Web.WebView2.WinForms.dll,Microsoft.Web.WebView2.WinForms.dll" `
  "/resource:wv2\runtimes\win-x64\native\WebView2Loader.dll,WebView2Loader.dll" `
  "/resource:index.html,index.html" GymPlan.cs
if ($LASTEXITCODE -ne 0) { throw "compile failed" }
Copy-Item index.html "..\weekly-workout-schedule.html"
Write-Host "Built: $(Resolve-Path '..\Weekly Workout Schedule.exe')"
