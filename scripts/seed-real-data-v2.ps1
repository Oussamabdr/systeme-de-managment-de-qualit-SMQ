$ErrorActionPreference = 'Stop'

$base = 'https://iso-lemon.vercel.app/api'
$placeholderPrefix = 'LIVE-DEMO-2026-05'
$password = 'Password123!'

function Login-Token($email, $plainPassword) {
  $body = "email=$([uri]::EscapeDataString($email))&password=$([uri]::EscapeDataString($plainPassword))"
  $resp = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/x-www-form-urlencoded' -Body $body
  return $resp.token
}

function Api-Get($path, $token) {
  return Invoke-RestMethod -Uri "$base$path" -Method Get -Headers @{ Authorization = "Bearer $token" }
}

function Api-Post($path, $token, $payload) {
  return Invoke-RestMethod -Uri "$base$path" -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body ($payload | ConvertTo-Json -Depth 12)
}

function Api-Patch($path, $token, $payload) {
  return Invoke-RestMethod -Uri "$base$path" -Method Patch -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body ($payload | ConvertTo-Json -Depth 12)
}

function Api-Delete($path, $token) {
  return Invoke-RestMethod -Uri "$base$path" -Method Delete -Headers @{ Authorization = "Bearer $token" }
}

function Ensure-User($users, $adminToken, $fullName, $email, $role) {
  $existing = $users | Where-Object { $_.email -eq $email } | Select-Object -First 1
  if ($existing) {
    return $existing
  }

  Api-Post '/users' $adminToken @{ fullName = $fullName; email = $email; password = $password; role = $role } | Out-Null
  $refreshed = (Api-Get '/users' $adminToken).data
  return $refreshed | Where-Object { $_.email -eq $email } | Select-Object -First 1
}

$adminToken = Login-Token 'admin@esi.edu' $password
$managerToken = Login-Token 'manager@esi.edu' $password

$users = (Api-Get '/users' $adminToken).data
$admin = $users | Where-Object { $_.email -eq 'admin@esi.edu' } | Select-Object -First 1
$manager = $users | Where-Object { $_.email -eq 'manager@esi.edu' } | Select-Object -First 1
$member = $users | Where-Object { $_.email -eq 'member@esi.edu' } | Select-Object -First 1
$caq = $users | Where-Object { $_.email -eq 'caq@esi.edu' } | Select-Object -First 1
$teamA = Ensure-User $users $adminToken 'Amina Bensalem' 'amina.bensalem@esi.edu' 'TEAM_MEMBER'
$teamB = Ensure-User $users $adminToken 'Youssef Merabet' 'youssef.merabet@esi.edu' 'TEAM_MEMBER'
$teamC = Ensure-User $users $adminToken 'Salma Ouassini' 'salma.ouassini@esi.edu' 'TEAM_MEMBER'
$teamD = Ensure-User $users $adminToken 'Karim Nouri' 'karim.nouri@esi.edu' 'TEAM_MEMBER'

if (-not $admin -or -not $manager -or -not $member -or -not $caq -or -not $teamA -or -not $teamB -or -not $teamC -or -not $teamD) {
  throw 'Required users not found for seeding.'
}

$oldProcesses = (Api-Get '/processes' $adminToken).data | Where-Object { $_.name -like "$placeholderPrefix*" } | Sort-Object createdAt
$oldProjects = (Api-Get '/projects' $adminToken).data | Where-Object { $_.name -like "$placeholderPrefix*" } | Sort-Object createdAt
$oldTasks = (Api-Get '/tasks' $managerToken).data | Where-Object { $_.title -like "$placeholderPrefix*" } | Sort-Object createdAt
$oldNCs = (Api-Get '/non-conformities' $adminToken).data | Where-Object { $_.title -like "$placeholderPrefix*" } | Sort-Object detectedAt
$oldCAPAs = (Api-Get '/corrective-actions' $adminToken).data | Where-Object { $_.title -like "$placeholderPrefix*" } | Sort-Object createdAt

$processPayloads = @(
  @{
    name = 'Supplier Qualification and Incoming Control'
    description = 'Supplier onboarding, approval, and incoming material verification.'
    responsiblePerson = 'Omar Bellal'
    objectives = @('Approve suppliers using objective criteria', 'Reduce incoming defects each quarter')
    inputs = @('Supplier dossiers', 'Purchase requisitions', 'Incoming lot data')
    outputs = @('Approved supplier list', 'Incoming inspection reports')
    knowledgeItems = @('Clause 8.4 supplier controls', 'Incoming inspection sampling')
    indicators = @(
      @{ name = 'Supplier Defect Rate'; target = 2; current = 3.1; unit = '%' },
      @{ name = 'On-time Supplier Delivery'; target = 95; current = 92; unit = '%' }
    )
  },
  @{
    name = 'Production Control and Line Stability'
    description = 'Daily production control, rework containment, and line stability monitoring.'
    responsiblePerson = 'Leila Boudiaf'
    objectives = @('Improve first-pass yield', 'Cut rework hours by 15 percent')
    inputs = @('Production plans', 'Control plans', 'Shift handover notes')
    outputs = @('Conforming finished goods', 'Stability review summaries')
    knowledgeItems = @('Process capability review', 'Shift-based control discipline')
    indicators = @(
      @{ name = 'First Pass Yield'; target = 98; current = 95.7; unit = '%' },
      @{ name = 'Rework Hours'; target = 40; current = 56; unit = 'hours/month' }
    )
  },
  @{
    name = 'Internal Audit and Improvement'
    description = 'Audit scheduling, findings tracking, and improvement follow-up.'
    responsiblePerson = 'Nadia Ait Salem'
    objectives = @('Close major findings on time', 'Increase verified improvement actions')
    inputs = @('Audit program', 'Previous findings', 'Improvement logs')
    outputs = @('Audit reports', 'Corrective action reviews')
    knowledgeItems = @('Risk-based auditing', 'Effectiveness verification')
    indicators = @(
      @{ name = 'Audit Closure SLA'; target = 90; current = 84; unit = '%' },
      @{ name = 'Verified Improvements'; target = 12; current = 7; unit = 'count' }
    )
  },
  @{
    name = 'Document Control'
    description = 'Controlled creation, review, release, and archival of quality documents.'
    responsiblePerson = 'Rania Cherif'
    objectives = @('Release document revisions within 24 hours', 'Eliminate obsolete document use')
    inputs = @('Document requests', 'Revision comments')
    outputs = @('Released documents', 'Archived obsolete revisions')
    knowledgeItems = @('Document lifecycle control', 'Revision history governance')
    indicators = @(
      @{ name = 'Release Cycle Time'; target = 24; current = 29; unit = 'hours' },
      @{ name = 'Obsolete Document Findings'; target = 0; current = 1; unit = 'count' }
    )
  },
  @{
    name = 'Training and Competence'
    description = 'Competence mapping, onboarding, and annual qualification tracking.'
    responsiblePerson = 'Mehdi Saidi'
    objectives = @('Keep training matrix current', 'Close competence gaps before audit')
    inputs = @('Training needs analysis', 'Skills matrix', 'Attendance records')
    outputs = @('Updated training matrix', 'Competence sign-offs')
    knowledgeItems = @('Competence evaluation', 'Training effectiveness review')
    indicators = @(
      @{ name = 'Training Completion Rate'; target = 98; current = 91; unit = '%' },
      @{ name = 'Overdue Certifications'; target = 0; current = 3; unit = 'count' }
    )
  }
)

$createdProcesses = @()
foreach ($payload in $processPayloads) {
  $createdProcesses += (Api-Post '/processes' $adminToken $payload).data
}

$projectPayloads = @(
  @{
    name = 'North Plant Supplier Recovery'
    description = 'Recover supplier quality across the north plant receiving stream.'
    ownerId = $manager.id
    startDate = (Get-Date).AddDays(-18).ToString('o')
    endDate = (Get-Date).AddDays(72).ToString('o')
  },
  @{
    name = 'Line A Yield Improvement'
    description = 'Improve line A yield through tighter control plans and training.'
    ownerId = $manager.id
    startDate = (Get-Date).AddDays(-12).ToString('o')
    endDate = (Get-Date).AddDays(88).ToString('o')
  },
  @{
    name = 'Audit Readiness Program'
    description = 'Close open findings and prepare evidence for the next audit cycle.'
    ownerId = $caq.id
    startDate = (Get-Date).AddDays(-2).ToString('o')
    endDate = (Get-Date).AddDays(58).ToString('o')
  },
  @{
    name = 'Packaging Traceability Upgrade'
    description = 'Improve pallet and label traceability from packaging to dispatch.'
    ownerId = $caq.id
    startDate = (Get-Date).AddDays(-7).ToString('o')
    endDate = (Get-Date).AddDays(84).ToString('o')
  },
  @{
    name = 'Calibration Compliance Drive'
    description = 'Restore calibration compliance for critical gauges and instruments.'
    ownerId = $manager.id
    startDate = (Get-Date).AddDays(-4).ToString('o')
    endDate = (Get-Date).AddDays(64).ToString('o')
  },
  @{
    name = 'Customer Complaint Reduction'
    description = 'Reduce customer complaints by tightening escalation and response loops.'
    ownerId = $manager.id
    startDate = (Get-Date).AddDays(-15).ToString('o')
    endDate = (Get-Date).AddDays(75).ToString('o')
  }
)

$createdProjects = @()
foreach ($payload in $projectPayloads) {
  $createdProjects += (Api-Post '/projects' $adminToken $payload).data
}

Api-Post "/projects/$($createdProjects[0].id)/processes" $adminToken @{ processIds = @($createdProcesses[0].id, $createdProcesses[2].id) } | Out-Null
Api-Post "/projects/$($createdProjects[1].id)/processes" $adminToken @{ processIds = @($createdProcesses[1].id, $createdProcesses[3].id) } | Out-Null
Api-Post "/projects/$($createdProjects[2].id)/processes" $adminToken @{ processIds = @($createdProcesses[2].id, $createdProcesses[4].id) } | Out-Null
Api-Post "/projects/$($createdProjects[3].id)/processes" $adminToken @{ processIds = @($createdProcesses[3].id, $createdProcesses[0].id) } | Out-Null
Api-Post "/projects/$($createdProjects[4].id)/processes" $adminToken @{ processIds = @($createdProcesses[4].id, $createdProcesses[1].id) } | Out-Null
Api-Post "/projects/$($createdProjects[5].id)/processes" $adminToken @{ processIds = @($createdProcesses[0].id, $createdProcesses[3].id) } | Out-Null

$baseTaskPayloads = @(
  @{ title = 'Amina Bensalem reviews supplier qualification pack'; description = 'Review the qualification dossier and sign off the latest supplier pack.'; status='TODO'; dueDate=(Get-Date).AddDays(16).ToString('o'); plannedHours=12; actualHours=0; projectId=$createdProjects[0].id; processId=$createdProcesses[0].id; assigneeId=$teamA.id },
  @{ title = 'Youssef Merabet updates incoming defect Pareto'; description = 'Refresh the Pareto with the latest non-conforming lots and comments.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(9).ToString('o'); plannedHours=8; actualHours=3; projectId=$createdProjects[0].id; processId=$createdProcesses[0].id; assigneeId=$teamB.id },
  @{ title = 'Leila Boudiaf closes supplier escalation actions'; description = 'Verify closure evidence for the top supplier escalation items.'; status='DONE'; dueDate=(Get-Date).AddDays(6).ToString('o'); plannedHours=10; actualHours=11; projectId=$createdProjects[0].id; processId=$createdProcesses[2].id; assigneeId=$manager.id },
  @{ title = 'Karim Nouri revises control plan checkpoints'; description = 'Adjust sampling frequency and critical checks on line A.'; status='TODO'; dueDate=(Get-Date).AddDays(19).ToString('o'); plannedHours=15; actualHours=0; projectId=$createdProjects[1].id; processId=$createdProcesses[1].id; assigneeId=$teamD.id },
  @{ title = 'Salma Ouassini completes gauge calibration round'; description = 'Complete calibration and MSA checks on the line A gauges.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(11).ToString('o'); plannedHours=14; actualHours=5; projectId=$createdProjects[1].id; processId=$createdProcesses[1].id; assigneeId=$teamC.id },
  @{ title = 'Amina Bensalem documents rework workshop decisions'; description = 'Capture the actions and owners from the rework workshop.'; status='DONE'; dueDate=(Get-Date).AddDays(5).ToString('o'); plannedHours=9; actualHours=9; projectId=$createdProjects[1].id; processId=$createdProcesses[1].id; assigneeId=$teamA.id },
  @{ title = 'Nadia Ait Salem maps audit evidence references'; description = 'Map every audit clause to a usable evidence reference.'; status='TODO'; dueDate=(Get-Date).AddDays(15).ToString('o'); plannedHours=16; actualHours=0; projectId=$createdProjects[2].id; processId=$createdProcesses[2].id; assigneeId=$caq.id },
  @{ title = 'Mehdi Saidi verifies prior NC effectiveness'; description = 'Check whether prior non-conformities remain contained and stable.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(7).ToString('o'); plannedHours=12; actualHours=4; projectId=$createdProjects[2].id; processId=$createdProcesses[2].id; assigneeId=$caq.id },
  @{ title = 'Rania Cherif completes audit readiness review'; description = 'Review final readiness and publish the evidence gap list.'; status='DONE'; dueDate=(Get-Date).AddDays(3).ToString('o'); plannedHours=8; actualHours=8; projectId=$createdProjects[2].id; processId=$createdProcesses[2].id; assigneeId=$manager.id },
  @{ title = 'Amina Bensalem validates traceability labels'; description = 'Validate the new label format on packaging and dispatch records.'; status='TODO'; dueDate=(Get-Date).AddDays(21).ToString('o'); plannedHours=10; actualHours=0; projectId=$createdProjects[3].id; processId=$createdProcesses[3].id; assigneeId=$teamA.id },
  @{ title = 'Youssef Merabet reviews gauge certificates'; description = 'Check certificates and expiry dates for all critical gauges.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(10).ToString('o'); plannedHours=7; actualHours=2; projectId=$createdProjects[4].id; processId=$createdProcesses[4].id; assigneeId=$teamB.id },
  @{ title = 'Salma Ouassini prepares customer complaint summary'; description = 'Summarize complaint trends and proposed containment measures.'; status='DONE'; dueDate=(Get-Date).AddDays(4).ToString('o'); plannedHours=9; actualHours=10; projectId=$createdProjects[5].id; processId=$createdProcesses[1].id; assigneeId=$teamC.id },
  @{ title = 'Karim Nouri updates document approval log'; description = 'Update the document control register and release log.'; status='TODO'; dueDate=(Get-Date).AddDays(18).ToString('o'); plannedHours=8; actualHours=0; projectId=$createdProjects[3].id; processId=$createdProcesses[3].id; assigneeId=$teamD.id },
  @{ title = 'Leila Boudiaf audits training completion gaps'; description = 'Audit overdue training completions and assign follow-ups.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(12).ToString('o'); plannedHours=11; actualHours=3; projectId=$createdProjects[4].id; processId=$createdProcesses[4].id; assigneeId=$manager.id },
  @{ title = 'Amina Bensalem closes complaint escalation notes'; description = 'Close escalation notes with evidence from the 8D review.'; status='DONE'; dueDate=(Get-Date).AddDays(6).ToString('o'); plannedHours=6; actualHours=6; projectId=$createdProjects[5].id; processId=$createdProcesses[1].id; assigneeId=$teamA.id },
  @{ title = 'Youssef Merabet checks line changeover discipline'; description = 'Observe the line changeover and record missed steps.'; status='TODO'; dueDate=(Get-Date).AddDays(20).ToString('o'); plannedHours=10; actualHours=0; projectId=$createdProjects[1].id; processId=$createdProcesses[1].id; assigneeId=$teamB.id },
  @{ title = 'Salma Ouassini reviews internal audit evidence'; description = 'Review sampled evidence for the internal audit package.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(8).ToString('o'); plannedHours=13; actualHours=4; projectId=$createdProjects[2].id; processId=$createdProcesses[2].id; assigneeId=$teamC.id },
  @{ title = 'Karim Nouri validates document revision release'; description = 'Validate release timing and obsolete document removal.'; status='DONE'; dueDate=(Get-Date).AddDays(5).ToString('o'); plannedHours=7; actualHours=7; projectId=$createdProjects[3].id; processId=$createdProcesses[3].id; assigneeId=$teamD.id }
)

$createdTasks = @()
foreach ($payload in $baseTaskPayloads) {
  $createdTasks += (Api-Post '/tasks' $managerToken $payload).data
}

$ncPayloads = @(
  @{ title = 'Supplier sampling plan drift on critical lots'; description = 'Two critical lots were inspected with a sampling deviation on receiving.'; status='OPEN'; severity='HIGH'; detectedAt=(Get-Date).AddDays(-3).ToString('o'); processId=$createdProcesses[0].id },
  @{ title = 'Revision mismatch on line A work instruction'; description = 'Operators followed an older instruction revision during a single shift.'; status='ANALYSIS'; severity='MEDIUM'; detectedAt=(Get-Date).AddDays(-6).ToString('o'); processId=$createdProcesses[1].id },
  @{ title = 'Audit evidence traceability gap'; description = 'Several audit records lacked a traceability link to the evidence matrix.'; status='OPEN'; severity='CRITICAL'; detectedAt=(Get-Date).AddDays(-2).ToString('o'); processId=$createdProcesses[2].id },
  @{ title = 'Label template formatting issue'; description = 'Label formatting was corrected and verified across all stations.'; status='CLOSED'; severity='LOW'; detectedAt=(Get-Date).AddDays(-20).ToString('o'); processId=$createdProcesses[1].id },
  @{ title = 'Expired calibration certificate on gauge set'; description = 'One high-use gauge set has an expired calibration certificate.'; status='OPEN'; severity='HIGH'; detectedAt=(Get-Date).AddDays(-1).ToString('o'); processId=$createdProcesses[4].id },
  @{ title = 'Training record missing shift B sign-off'; description = 'Shift B competence sign-off is missing for one operator.'; status='ANALYSIS'; severity='MEDIUM'; detectedAt=(Get-Date).AddDays(-5).ToString('o'); processId=$createdProcesses[4].id },
  @{ title = 'Packaging pallet scan mismatch'; description = 'A pallet barcode did not match the shipping record during verification.'; status='OPEN'; severity='CRITICAL'; detectedAt=(Get-Date).AddDays(-4).ToString('o'); processId=$createdProcesses[3].id },
  @{ title = 'Clause 9.2 evidence gap closed with follow-up'; description = 'Audit evidence gap was reviewed, corrected, and accepted for closure.'; status='CLOSED'; severity='LOW'; detectedAt=(Get-Date).AddDays(-12).ToString('o'); processId=$createdProcesses[2].id }
)

$createdNCs = @()
foreach ($payload in $ncPayloads) {
  $createdNCs += (Api-Post '/non-conformities' $adminToken $payload).data
}

$capaPayloads = @(
  @{ title = 'Reinforce receiving checklist discipline'; description = 'Deploy a mandatory checklist and supervisor sign-off for critical lots.'; recommendation='Use a visual checklist with shift audit'; actionType='CORRECTIVE'; status='OPEN'; severity='HIGH'; rootCause='Checklist step ambiguity under shift pressure'; containmentAction='100 percent check for next 5 lots'; effectivenessCriteria='No sampling deviations for 30 days'; dueDate=(Get-Date).AddDays(15).ToString('o'); nonConformityId=$createdNCs[0].id },
  @{ title = 'Add work instruction revision gate'; description = 'Add a pre-shift revision gate in production startup.'; recommendation='Digital WI validation at line start'; actionType='CORRECTIVE'; status='IN_PROGRESS'; severity='MEDIUM'; rootCause='Revision release communication gap'; containmentAction='Supervisor briefing each shift'; effectivenessCriteria='Zero outdated WI usage for 6 weeks'; dueDate=(Get-Date).AddDays(12).ToString('o'); nonConformityId=$createdNCs[1].id },
  @{ title = 'Document evidence ownership matrix'; description = 'Assign evidence ownership and confirm the lifecycle for the audit package.'; recommendation='RACI for evidence lifecycle'; actionType='PREVENTIVE'; status='CANCELLED'; severity='LOW'; rootCause='Overlap with new governance workflow'; containmentAction='Interim spreadsheet tracker'; effectivenessCriteria='Complete ownership coverage'; dueDate=(Get-Date).AddDays(20).ToString('o'); nonConformityId=$createdNCs[2].id },
  @{ title = 'Create supplier escalation cadence'; description = 'Create biweekly escalation meetings with top-risk suppliers.'; recommendation='Standing agenda with KPI thresholds'; actionType='PREVENTIVE'; status='OPEN'; severity='MEDIUM'; rootCause='Escalation triggers not formalized'; containmentAction='Interim manual alert threshold'; effectivenessCriteria='Defect trend reduced for 2 consecutive months'; dueDate=(Get-Date).AddDays(25).ToString('o'); nonConformityId=$createdNCs[0].id },
  @{ title = 'Auto-validate traceability fields'; description = 'Validate mandatory traceability fields before evidence submission.'; recommendation='Template validation before submission'; actionType='CORRECTIVE'; status='IN_PROGRESS'; severity='CRITICAL'; rootCause='Template allowed blank linkage fields'; containmentAction='Manual QA gate before upload'; effectivenessCriteria='100 percent records with valid trace links'; dueDate=(Get-Date).AddDays(9).ToString('o'); nonConformityId=$createdNCs[2].id },
  @{ title = 'Finalize gauge certificate recovery'; description = 'Replace or re-certify expired gauges and document the recheck.'; recommendation='Add monthly expiry dashboard'; actionType='CORRECTIVE'; status='OPEN'; severity='HIGH'; rootCause='Calibration reminders were not escalated'; containmentAction='Remove gauge from service'; effectivenessCriteria='All gauges recertified and tracked'; dueDate=(Get-Date).AddDays(14).ToString('o'); nonConformityId=$createdNCs[4].id },
  @{ title = 'Complete shift B competence sign-off'; description = 'Close the missing competence record for shift B.'; recommendation='Electronic sign-off after each shift'; actionType='PREVENTIVE'; status='DONE'; severity='MEDIUM'; rootCause='Training matrix update delay'; containmentAction='Supervisor review of current shift'; effectivenessCriteria='All shift sign-offs complete'; dueDate=(Get-Date).AddDays(11).ToString('o'); nonConformityId=$createdNCs[5].id; effectivenessStatus='VERIFIED'; verifiedById=$caq.id },
  @{ title = 'Stabilize packaging scan verification'; description = 'Align label scan verification with dispatch records.'; recommendation='Scanner check at packaging exit'; actionType='CORRECTIVE'; status='DONE'; severity='CRITICAL'; rootCause='Barcode template mismatch'; containmentAction='Manual check of current pallet batch'; effectivenessCriteria='Zero scan mismatches for 30 days'; dueDate=(Get-Date).AddDays(8).ToString('o'); nonConformityId=$createdNCs[6].id; effectivenessStatus='VERIFIED'; verifiedById=$admin.id },
  @{ title = 'Close audit evidence gap'; description = 'Confirm correction and archive updated clause 9.2 evidence.'; recommendation='Audit package checklist'; actionType='CORRECTIVE'; status='DONE'; severity='LOW'; rootCause='Evidence mapping was incomplete'; containmentAction='Evidence map review'; effectivenessCriteria='Evidence pack approved without gaps'; dueDate=(Get-Date).AddDays(7).ToString('o'); nonConformityId=$createdNCs[7].id; effectivenessStatus='VERIFIED'; verifiedById=$caq.id },
  @{ title = 'Release document approval backlog'; description = 'Approve the held documents and clear the pending release queue.'; recommendation='Document SLA tracking'; actionType='CORRECTIVE'; status='IN_PROGRESS'; severity='LOW'; rootCause='Approvals accumulated during leave period'; containmentAction='Temporary approval triage'; effectivenessCriteria='All documents released within 24 hours'; dueDate=(Get-Date).AddDays(10).ToString('o'); nonConformityId=$createdNCs[3].id }
)

$createdCAPAs = @()
foreach ($payload in $capaPayloads) {
  $createdCAPAs += (Api-Post '/corrective-actions' $adminToken $payload).data
}

# Close selected NCs after their CAPAs were created with VERIFIED effectiveness.
Api-Patch "/non-conformities/$($createdNCs[5].id)" $adminToken @{ status = 'CLOSED' } | Out-Null
Api-Patch "/non-conformities/$($createdNCs[6].id)" $adminToken @{ status = 'CLOSED' } | Out-Null
Api-Patch "/non-conformities/$($createdNCs[7].id)" $adminToken @{ status = 'CLOSED' } | Out-Null

# Remove the old placeholder records so no LIVE-DEMO naming remains.
foreach ($item in $oldCAPAs) {
  Api-Delete "/corrective-actions/$($item.id)" $adminToken | Out-Null
}
foreach ($item in $oldNCs) {
  Api-Delete "/non-conformities/$($item.id)" $adminToken | Out-Null
}
foreach ($item in $oldTasks) {
  Api-Delete "/tasks/$($item.id)" $managerToken | Out-Null
}
foreach ($item in $oldProjects) {
  Api-Post "/projects/$($item.id)/processes" $adminToken @{ processIds = @() } | Out-Null
  Api-Delete "/projects/$($item.id)" $adminToken | Out-Null
}
foreach ($item in $oldProcesses) {
  Api-Delete "/processes/$($item.id)" $adminToken | Out-Null
}

$summary = [ordered]@{
  created = [ordered]@{
    processes = $createdProcesses.Count
    projects = $createdProjects.Count
    tasks = $createdTasks.Count
    nonConformities = $createdNCs.Count
    correctiveActions = $createdCAPAs.Count
    users = 4
  }
  removed = [ordered]@{
    processes = $oldProcesses.Count
    projects = $oldProjects.Count
    tasks = $oldTasks.Count
    nonConformities = $oldNCs.Count
    correctiveActions = $oldCAPAs.Count
  }
  taskStatusBreakdown = ((Api-Get '/tasks' $managerToken).data | Group-Object status | ForEach-Object { [ordered]@{ status = $_.Name; count = $_.Count } })
  ncStatusBreakdown = ((Api-Get '/non-conformities' $adminToken).data | Group-Object status | ForEach-Object { [ordered]@{ status = $_.Name; count = $_.Count } })
  capaStatusBreakdown = ((Api-Get '/corrective-actions' $adminToken).data | Group-Object status | ForEach-Object { [ordered]@{ status = $_.Name; count = $_.Count } })
}

$summary | ConvertTo-Json -Depth 8
