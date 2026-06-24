$ErrorActionPreference = 'Stop'

$base = 'https://iso-lemon.vercel.app/api'
$password = 'Password123!'

function Login-Token($email, $plainPassword) {
  $body = "email=$([uri]::EscapeDataString($email))&password=$([uri]::EscapeDataString($plainPassword))"
  $resp = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/x-www-form-urlencoded' -Body $body
  return $resp.token
}

function Api-Get($path, $token) {
  return Invoke-RestMethod -Uri "$base$path" -Method Get -Headers @{ Authorization = "Bearer $token" }
}

function Api-Put($path, $token, $payload) {
  return Invoke-RestMethod -Uri "$base$path" -Method Put -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body ($payload | ConvertTo-Json -Depth 16)
}

$adminToken = Login-Token 'admin@esi.edu' $password

$criteria = (Api-Get '/criteria' $adminToken).data
$processes = (Api-Get '/processes' $adminToken).data

function Get-VeracityLevel($score) {
  if ($score -ge 85) { return 'TRUE' }
  if ($score -ge 60) { return 'RATHER_TRUE' }
  if ($score -ge 25) { return 'RATHER_FALSE' }
  return 'FALSE'
}

$processProfiles = @(
  @{ match = 'Supplier'; high = 0; medium = 1; low = 2; zero = 3 },
  @{ match = 'Production'; high = 1; medium = 2; low = 3; zero = 0 },
  @{ match = 'Audit'; high = 2; medium = 3; low = 0; zero = 1 },
  @{ match = 'Document'; high = 3; medium = 0; low = 1; zero = 2 },
  @{ match = 'Training'; high = 0; medium = 2; low = 1; zero = 3 },
  @{ match = 'Packaging'; high = 1; medium = 3; low = 2; zero = 0 },
  @{ match = 'Calibration'; high = 2; medium = 0; low = 3; zero = 1 },
  @{ match = 'Complaint'; high = 3; medium = 1; low = 0; zero = 2 },
  @{ match = 'North Plant'; high = 1; medium = 0; low = 2; zero = 3 },
  @{ match = 'Line A'; high = 2; medium = 1; low = 3; zero = 0 },
  @{ match = 'Readiness'; high = 3; medium = 2; low = 0; zero = 1 },
  @{ match = 'Control'; high = 0; medium = 3; low = 1; zero = 2 }
)

$summary = @()

for ($processIndex = 0; $processIndex -lt $processes.Count; $processIndex++) {
  $process = $processes[$processIndex]
  $profile = $processProfiles | Where-Object { $process.name -like "*$($_.match)*" } | Select-Object -First 1
  if (-not $profile) { $profile = $processProfiles[$processIndex % $processProfiles.Count] }

  $items = @()
  for ($criterionIndex = 0; $criterionIndex -lt $criteria.Count; $criterionIndex++) {
    $criterion = $criteria[$criterionIndex]
    $bucket = (($criterionIndex + $processIndex) % 4)
    switch ($bucket) {
      0 { $score = 95; $selected = $true }
      1 { $score = 78; $selected = $true }
      2 { $score = 42; $selected = $true }
      default { $score = 0; $selected = $false }
    }

    if ($criterion.code -match '^(ISO-CR-0(1[6-9]|2[0-8]))') { $score = [Math]::Min(100, $score + 10) }
    if ($criterion.code -match '^(ISO-CR-0(3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9]|1[0-1][0-9]))') { $score = [Math]::Max(0, $score - 10) }
    if ($process.name -like '*Audit*' -and $criterion.code -match '^(ISO-CR-0(9|10|11|12|13|14|15))') { $score = [Math]::Min(100, $score + 5) }
    if ($process.name -like '*Training*' -and $criterion.code -match '^(ISO-CR-0(7|8|9|10|11|12|13|14|15))') { $score = [Math]::Min(100, $score + 5) }
    if ($process.name -like '*Supplier*' -and $criterion.code -match '^(ISO-CR-0(4|5|6|7|8|9|10|11|12|13|14|15))') { $score = [Math]::Min(100, $score + 5) }

    $items += @{
      code = $criterion.code
      name = $criterion.title
      selected = $selected
      score = $score
      rate = $score
      veracityLevel = (Get-VeracityLevel $score)
      notes = "Restored from full ISO catalog for $($process.name)"
    }
  }

  $response = Api-Put "/processes/$($process.id)/assessment" $adminToken @{ items = $items }
  $summary += [pscustomobject]@{
    process = $process.name
    requirements = $response.data.summary.requirementCount
    overallScore = $response.data.summary.overallScore
  }
}

[pscustomobject]@{
  restoredProcesses = $processes.Count
  criteriaPerProcess = $criteria.Count
  totalRows = $processes.Count * $criteria.Count
  sample = $summary | Select-Object -First 6
} | ConvertTo-Json -Depth 6
