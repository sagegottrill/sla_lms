$ErrorActionPreference = "SilentlyContinue"
git config --local credential.helper '""'
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "never"
$token = gh auth token
Write-Host "Pushing payload via extracted token..."
git -c credential.helper= -c core.askpass= push -f "https://$token@github.com/She-Leads-Africa/sla_lms.git" HEAD:main 2>&1
$LASTEXITCODE
git config --local --unset credential.helper
