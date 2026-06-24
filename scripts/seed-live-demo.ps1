$ErrorActionPreference = 'Stop'

$base = 'https://iso-lemon.vercel.app/api'
$seedTag = 'LIVE-DEMO-2026-05'

function Login-Token($email, $password) {
  $body = "email=$([uri]::EscapeDataString($email))&password=$([uri]::EscapeDataString($password))"
  $resp = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/x-www-form-urlencoded' -Body $body
  return $resp.token
}

function Api-Get($path, $token) {
  return Invoke-RestMethod -Uri "$base$path" -Method Get -Headers @{ Authorization = "Bearer $token" }
}

function Api-Post($path, $token, $payload) {
  return Invoke-RestMethod -Uri "$base$path" -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body ($payload | ConvertTo-Json -Depth 12)
}

$adminToken = Login-Token 'admin@esi.edu' 'Password123!'
$managerToken = Login-Token 'manager@esi.edu' 'Password123!'

$users = (Api-Get '/users' $adminToken).data
$manager = $users | Where-Object { $_.email -eq 'manager@esi.edu' } | Select-Object -First 1
$member = $users | Where-Object { $_.email -eq 'member@esi.edu' } | Select-Object -First 1
$caq = $users | Where-Object { $_.email -eq 'caq@esi.edu' } | Select-Object -First 1

if (-not $manager -or -not $member -or -not $caq) { throw 'Required users not found for seeding.' }

$processPayloads = @(
  @{
    name = "$seedTag - Purchasing & Supplier Control"
    description = 'Supplier qualification, purchasing controls, and incoming quality verification.'
    responsiblePerson = 'Omar Bellal'
    objectives = @('Reduce supplier non-conformities by 20 percent', 'Maintain approved supplier list monthly')
    inputs = @('Purchase requisitions', 'Supplier certificates')
    outputs = @('Approved purchase orders', 'Incoming inspection reports')
    knowledgeItems = @('ISO 9001 clause 8.4 controls', 'Supplier scorecard methodology')
    indicators = @(
      @{ name = 'Supplier Defect Rate'; target = 2; current = 3.4; unit = '%' },
      @{ name = 'On-time Supplier Delivery'; target = 95; current = 91; unit = '%' }
    )
  },
  @{
    name = "$seedTag - Production Execution"
    description = 'Planning, execution, in-process checks, and release readiness.'
    responsiblePerson = 'Leila Boudiaf'
    objectives = @('Improve first-pass yield', 'Reduce rework cycle time')
    inputs = @('Production plans', 'Work instructions')
    outputs = @('Conforming finished goods', 'In-process quality records')
    knowledgeItems = @('Process capability analysis', 'Control plan discipline')
    indicators = @(
      @{ name = 'First Pass Yield'; target = 98; current = 95.5; unit = '%' },
      @{ name = 'Rework Hours'; target = 40; current = 63; unit = 'hours/month' }
    )
  },
  @{
    name = "$seedTag - Internal Audit & Improvement"
    description = 'Audit planning, findings management, and continuous improvement tracking.'
    responsiblePerson = 'Nadia Ait Salem'
    objectives = @('Close all major findings within SLA', 'Increase preventive actions adoption')
    inputs = @('Audit program', 'Historical findings')
    outputs = @('Audit reports', 'Improvement action plans')
    knowledgeItems = @('Risk-based thinking in audits', 'Root cause effectiveness validation')
    indicators = @(
      @{ name = 'Audit Finding Closure SLA'; target = 90; current = 86; unit = '%' },
      @{ name = 'Preventive Actions Ratio'; target = 35; current = 28; unit = '%' }
    )
  }
)

$processes = @()
foreach ($p in $processPayloads) {
  $created = Api-Post '/processes' $adminToken $p
  $processes += $created.data
}

$today = Get-Date
$projectsPayload = @(
  @{ name = "$seedTag - Supplier Quality Recovery"; description = 'Recover supplier quality KPIs and stabilize incoming defects.'; ownerId = $manager.id; startDate = $today.AddDays(-20).ToString('o'); endDate = $today.AddDays(70).ToString('o') },
  @{ name = "$seedTag - FPY Excellence Program"; description = 'Raise production first-pass yield with targeted process controls.'; ownerId = $manager.id; startDate = $today.AddDays(-10).ToString('o'); endDate = $today.AddDays(90).ToString('o') },
  @{ name = "$seedTag - Audit Readiness Q3"; description = 'Prepare complete audit evidence pack and close open findings.'; ownerId = $caq.id; startDate = $today.ToString('o'); endDate = $today.AddDays(60).ToString('o') }
)

$projects = @()
foreach ($p in $projectsPayload) {
  $created = Api-Post '/projects' $adminToken $p
  $projects += $created.data
}

Api-Post "/projects/$($projects[0].id)/processes" $adminToken @{ processIds = @($processes[0].id, $processes[2].id) } | Out-Null
Api-Post "/projects/$($projects[1].id)/processes" $adminToken @{ processIds = @($processes[1].id) } | Out-Null
Api-Post "/projects/$($projects[2].id)/processes" $adminToken @{ processIds = @($processes[2].id, $processes[1].id) } | Out-Null

$taskPayloads = @(
  @{ title = "$seedTag - Qualify 3 backup suppliers"; description = 'Execute qualification checklist and capability visit for 3 backup suppliers.'; status='TODO'; dueDate=$today.AddDays(14).ToString('o'); plannedHours=24; actualHours=0; projectId=$projects[0].id; processId=$processes[0].id; assigneeId=$member.id },
  @{ title = "$seedTag - Weekly incoming defect Pareto"; description = 'Publish Pareto by supplier and component family every Friday.'; status='IN_PROGRESS'; dueDate=$today.AddDays(7).ToString('o'); plannedHours=10; actualHours=4; projectId=$projects[0].id; processId=$processes[0].id; assigneeId=$caq.id },
  @{ title = "$seedTag - Supplier escalation closure"; description = 'Close top-2 supplier escalation plans with verified evidence.'; status='DONE'; dueDate=$today.AddDays(5).ToString('o'); plannedHours=12; actualHours=13; projectId=$projects[0].id; processId=$processes[2].id; assigneeId=$manager.id },
  @{ title = "$seedTag - Update control plan for line A"; description = 'Revise control points and sampling frequencies for critical operations.'; status='TODO'; dueDate=$today.AddDays(21).ToString('o'); plannedHours=18; actualHours=0; projectId=$projects[1].id; processId=$processes[1].id; assigneeId=$member.id },
  @{ title = "$seedTag - Calibrate in-process gauges"; description = 'Complete calibration and MSA check for all in-process gauges.'; status='IN_PROGRESS'; dueDate=$today.AddDays(10).ToString('o'); plannedHours=16; actualHours=6; projectId=$projects[1].id; processId=$processes[1].id; assigneeId=$member.id },
  @{ title = "$seedTag - Rework root-cause workshop"; description = 'Facilitate workshop and action plan for top recurring rework causes.'; status='DONE'; dueDate=$today.AddDays(4).ToString('o'); plannedHours=14; actualHours=15; projectId=$projects[1].id; processId=$processes[1].id; assigneeId=$manager.id },
  @{ title = "$seedTag - Audit evidence mapping"; description = 'Map objective evidence for clauses 8.4, 8.5, and 9.2.'; status='TODO'; dueDate=$today.AddDays(12).ToString('o'); plannedHours=20; actualHours=0; projectId=$projects[2].id; processId=$processes[2].id; assigneeId=$caq.id },
  @{ title = "$seedTag - Verify previous NC effectiveness"; description = 'Review closure evidence and perform spot checks for prior NCs.'; status='IN_PROGRESS'; dueDate=$today.AddDays(8).ToString('o'); plannedHours=11; actualHours=5; projectId=$projects[2].id; processId=$processes[2].id; assigneeId=$caq.id },
  @{ title = "$seedTag - Final audit readiness review"; description = 'Conduct readiness review and publish risk log before audit.'; status='DONE'; dueDate=$today.AddDays(3).ToString('o'); plannedHours=9; actualHours=9; projectId=$projects[2].id; processId=$processes[2].id; assigneeId=$manager.id }
)

$tasks = @()
foreach ($t in $taskPayloads) {
  $created = Api-Post '/tasks' $managerToken $t
  $tasks += $created.data
}

$ncPayloads = @(
  @{ title = "$seedTag - Incoming inspection sampling not respected"; description = 'Sampling plan was not followed for two critical lots during incoming inspection.'; status='OPEN'; severity='HIGH'; detectedAt=$today.AddDays(-3).ToString('o'); processId=$processes[0].id },
  @{ title = "$seedTag - Work instruction version mismatch"; description = 'Operators used outdated WI revision on production line A for one shift.'; status='ANALYSIS'; severity='MEDIUM'; detectedAt=$today.AddDays(-6).ToString('o'); processId=$processes[1].id },
  @{ title = "$seedTag - Missing audit evidence traceability"; description = 'Several records lacked traceability links in the audit evidence matrix.'; status='OPEN'; severity='CRITICAL'; detectedAt=$today.AddDays(-2).ToString('o'); processId=$processes[2].id },
  @{ title = "$seedTag - Label template formatting issue"; description = 'Label template had a formatting issue; corrected and verified across all stations.'; status='CLOSED'; severity='LOW'; detectedAt=$today.AddDays(-20).ToString('o'); processId=$processes[1].id }
)

$ncs = @()
foreach ($n in $ncPayloads) {
  $created = Api-Post '/non-conformities' $adminToken $n
  $ncs += $created.data
}

$capaPayloads = @(
  @{ title = "$seedTag - Reinforce incoming QC checklist"; description='Deploy mandatory checklist and supervisor sign-off for critical lots.'; recommendation='Use visual station checklist with shift audit'; actionType='CORRECTIVE'; status='OPEN'; severity='HIGH'; rootCause='Checklist step ambiguity under shift pressure'; containmentAction='100 percent check for next 5 lots'; effectivenessCriteria='No sampling deviations for 30 days'; dueDate=$today.AddDays(15).ToString('o'); nonConformityId=$ncs[0].id },
  @{ title = "$seedTag - WI revision control gate"; description='Add pre-shift WI revision gate in production startup routine.'; recommendation='Digital WI validation at line start'; actionType='CORRECTIVE'; status='IN_PROGRESS'; severity='MEDIUM'; rootCause='Revision release communication gap'; containmentAction='Supervisor briefing each shift'; effectivenessCriteria='Zero outdated WI usage for 6 weeks'; dueDate=$today.AddDays(12).ToString('o'); nonConformityId=$ncs[1].id },
  @{ title = "$seedTag - Audit evidence ownership matrix"; description='Define and approve ownership for each audit evidence artifact.'; recommendation='RACI for evidence lifecycle'; actionType='PREVENTIVE'; status='CANCELLED'; severity='LOW'; rootCause='Overlap with newly approved governance workflow'; containmentAction='Use interim spreadsheet tracker'; effectivenessCriteria='Complete ownership coverage'; dueDate=$today.AddDays(20).ToString('o'); nonConformityId=$ncs[2].id },
  @{ title = "$seedTag - Supplier escalation cadence"; description='Create biweekly escalation meeting with top-risk suppliers.'; recommendation='Standing agenda with KPI thresholds'; actionType='PREVENTIVE'; status='OPEN'; severity='MEDIUM'; rootCause='Escalation triggers not formalized'; containmentAction='Interim manual alert threshold'; effectivenessCriteria='Defect trend reduced for 2 consecutive months'; dueDate=$today.AddDays(25).ToString('o'); nonConformityId=$ncs[0].id },
  @{ title = "$seedTag - Traceability field auto-validation"; description='Implement mandatory traceability fields in evidence template.'; recommendation='Template validation before submission'; actionType='CORRECTIVE'; status='IN_PROGRESS'; severity='CRITICAL'; rootCause='Template allowed blank linkage fields'; containmentAction='Manual QA gate before upload'; effectivenessCriteria='100 percent records with valid trace links'; dueDate=$today.AddDays(9).ToString('o'); nonConformityId=$ncs[2].id }
)

$capas = @()
foreach ($c in $capaPayloads) {
  $created = Api-Post '/corrective-actions' $adminToken $c
  $capas += $created.data
}

$result = [ordered]@{
  seedTag = $seedTag
  created = [ordered]@{
    processes = $processes.Count
    projects = $projects.Count
    tasks = $tasks.Count
    nonConformities = $ncs.Count
    correctiveActions = $capas.Count
  }
  taskStatusBreakdown = ($tasks | Group-Object status | ForEach-Object { [ordered]@{ status = $_.Name; count = $_.Count } })
  ncStatusBreakdown = ($ncs | Group-Object status | ForEach-Object { [ordered]@{ status = $_.Name; count = $_.Count } })
  capaStatusBreakdown = ($capas | Group-Object status | ForEach-Object { [ordered]@{ status = $_.Name; count = $_.Count } })
}

$result | ConvertTo-Json -Depth 8
