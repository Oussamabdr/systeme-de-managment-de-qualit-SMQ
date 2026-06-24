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

function Ensure-User($users, $adminToken, $fullName, $email, $role) {
  $existing = $users | Where-Object { $_.email -eq $email } | Select-Object -First 1
  if ($existing) {
    return $existing
  }

  Api-Post '/users' $adminToken @{ fullName = $fullName; email = $email; password = $password; role = $role } | Out-Null
  $refreshed = (Api-Get '/users' $adminToken).data
  return $refreshed | Where-Object { $_.email -eq $email } | Select-Object -First 1
}

function Update-ListItems($items, $updates, $token, $pathTemplate) {
  for ($i = 0; $i -lt $updates.Count -and $i -lt $items.Count; $i++) {
    Api-Patch ($pathTemplate -f $items[$i].id) $token $updates[$i] | Out-Null
  }
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

$users = (Api-Get '/users' $adminToken).data
$teamA = $users | Where-Object { $_.email -eq 'amina.bensalem@esi.edu' } | Select-Object -First 1
$teamB = $users | Where-Object { $_.email -eq 'youssef.merabet@esi.edu' } | Select-Object -First 1
$teamC = $users | Where-Object { $_.email -eq 'salma.ouassini@esi.edu' } | Select-Object -First 1
$teamD = $users | Where-Object { $_.email -eq 'karim.nouri@esi.edu' } | Select-Object -First 1

if (-not $admin -or -not $manager -or -not $member -or -not $caq -or -not $teamA -or -not $teamB -or -not $teamC -or -not $teamD) {
  throw 'Required users not found for seeding.'
}

$placeholderProcesses = (Api-Get '/processes' $adminToken).data | Where-Object { $_.name -like "$placeholderPrefix*" } | Sort-Object createdAt
$placeholderProjects = (Api-Get '/projects' $adminToken).data | Where-Object { $_.name -like "$placeholderPrefix*" } | Sort-Object createdAt
$placeholderTasks = (Api-Get '/tasks' $managerToken).data | Where-Object { $_.title -like "$placeholderPrefix*" } | Sort-Object createdAt
$placeholderNCs = (Api-Get '/non-conformities' $adminToken).data | Where-Object { $_.title -like "$placeholderPrefix*" } | Sort-Object detectedAt
$placeholderCAPAs = (Api-Get '/corrective-actions' $adminToken).data | Where-Object { $_.title -like "$placeholderPrefix*" } | Sort-Object createdAt

$processRenamePayloads = @(
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
  }
)

Update-ListItems $placeholderProcesses $processRenamePayloads $adminToken '/processes/{0}'

$newProcesses = @(
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
foreach ($p in $newProcesses) {
  $createdProcesses += (Api-Post '/processes' $adminToken $p).data
}

$allProcesses = @()
$allProcesses += $placeholderProcesses | ForEach-Object { $_ }
$allProcesses += $createdProcesses

$projectRenamePayloads = @(
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
  }
)

Update-ListItems $placeholderProjects $projectRenamePayloads $adminToken '/projects/{0}'

$newProjects = @(
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
foreach ($p in $newProjects) {
  $createdProjects += (Api-Post '/projects' $adminToken $p).data
}

$allProjects = @()
$allProjects += $placeholderProjects | ForEach-Object { $_ }
$allProjects += $createdProjects

# Assign the processes to projects to create varied progress profiles.
Api-Post "/projects/$($allProjects[0].id)/processes" $adminToken @{ processIds = @($allProcesses[0].id, $allProcesses[2].id) } | Out-Null
Api-Post "/projects/$($allProjects[1].id)/processes" $adminToken @{ processIds = @($allProcesses[1].id, $allProcesses[3].id) } | Out-Null
Api-Post "/projects/$($allProjects[2].id)/processes" $adminToken @{ processIds = @($allProcesses[2].id, $allProcesses[4].id) } | Out-Null
Api-Post "/projects/$($allProjects[3].id)/processes" $adminToken @{ processIds = @($allProcesses[3].id, $allProcesses[0].id) } | Out-Null
Api-Post "/projects/$($allProjects[4].id)/processes" $adminToken @{ processIds = @($allProcesses[4].id, $allProcesses[1].id) } | Out-Null
Api-Post "/projects/$($allProjects[5].id)/processes" $adminToken @{ processIds = @($allProcesses[0].id, $allProcesses[3].id) } | Out-Null

$taskRenamePayloads = @(
  @{ title = 'Amina Bensalem reviews supplier qualification pack'; description = 'Review the qualification dossier and sign off the latest supplier pack.'; status='TODO'; dueDate=(Get-Date).AddDays(16).ToString('o'); plannedHours=12; actualHours=0; projectId=$placeholderProjects[0].id; processId=$allProcesses[0].id; assigneeId=$teamA.id },
  @{ title = 'Youssef Merabet updates incoming defect Pareto'; description = 'Refresh the Pareto with the latest non-conforming lots and comments.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(9).ToString('o'); plannedHours=8; actualHours=3; projectId=$placeholderProjects[0].id; processId=$allProcesses[0].id; assigneeId=$teamB.id },
  @{ title = 'Leila Boudiaf closes supplier escalation actions'; description = 'Verify closure evidence for the top supplier escalation items.'; status='DONE'; dueDate=(Get-Date).AddDays(6).ToString('o'); plannedHours=10; actualHours=11; projectId=$placeholderProjects[0].id; processId=$allProcesses[2].id; assigneeId=$manager.id },
  @{ title = 'Karim Nouri revises control plan checkpoints'; description = 'Adjust sampling frequency and critical checks on line A.'; status='TODO'; dueDate=(Get-Date).AddDays(19).ToString('o'); plannedHours=15; actualHours=0; projectId=$placeholderProjects[1].id; processId=$allProcesses[1].id; assigneeId=$teamD.id },
  @{ title = 'Salma Ouassini completes gauge calibration round'; description = 'Complete calibration and MSA checks on the line A gauges.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(11).ToString('o'); plannedHours=14; actualHours=5; projectId=$placeholderProjects[1].id; processId=$allProcesses[1].id; assigneeId=$teamC.id },
  @{ title = 'Amina Bensalem documents rework workshop decisions'; description = 'Capture the actions and owners from the rework workshop.'; status='DONE'; dueDate=(Get-Date).AddDays(5).ToString('o'); plannedHours=9; actualHours=9; projectId=$placeholderProjects[1].id; processId=$allProcesses[1].id; assigneeId=$teamA.id },
  @{ title = 'Nadia Ait Salem maps audit evidence references'; description = 'Map every audit clause to a usable evidence reference.'; status='TODO'; dueDate=(Get-Date).AddDays(15).ToString('o'); plannedHours=16; actualHours=0; projectId=$placeholderProjects[2].id; processId=$allProcesses[2].id; assigneeId=$caq.id },
  @{ title = 'Mehdi Saidi verifies prior NC effectiveness'; description = 'Check whether prior non-conformities remain contained and stable.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(7).ToString('o'); plannedHours=12; actualHours=4; projectId=$placeholderProjects[2].id; processId=$allProcesses[2].id; assigneeId=$caq.id },
  @{ title = 'Rania Cherif completes audit readiness review'; description = 'Review final readiness and publish the evidence gap list.'; status='DONE'; dueDate=(Get-Date).AddDays(3).ToString('o'); plannedHours=8; actualHours=8; projectId=$placeholderProjects[2].id; processId=$allProcesses[2].id; assigneeId=$manager.id }
)

$newTaskPayloads = @(
  @{ title = 'Amina Bensalem validates traceability labels'; description = 'Validate the new label format on packaging and dispatch records.'; status='TODO'; dueDate=(Get-Date).AddDays(21).ToString('o'); plannedHours=10; actualHours=0; projectId=$createdProjects[0].id; processId=$allProcesses[3].id; assigneeId=$teamA.id },
  @{ title = 'Youssef Merabet reviews gauge certificates'; description = 'Check certificates and expiry dates for all critical gauges.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(10).ToString('o'); plannedHours=7; actualHours=2; projectId=$createdProjects[1].id; processId=$allProcesses[4].id; assigneeId=$teamB.id },
  @{ title = 'Salma Ouassini prepares customer complaint summary'; description = 'Summarize complaint trends and proposed containment measures.'; status='DONE'; dueDate=(Get-Date).AddDays(4).ToString('o'); plannedHours=9; actualHours=10; projectId=$createdProjects[2].id; processId=$allProcesses[1].id; assigneeId=$teamC.id },
  @{ title = 'Karim Nouri updates document approval log'; description = 'Update the document control register and release log.'; status='TODO'; dueDate=(Get-Date).AddDays(18).ToString('o'); plannedHours=8; actualHours=0; projectId=$createdProjects[0].id; processId=$allProcesses[3].id; assigneeId=$teamD.id },
  @{ title = 'Leila Boudiaf audits training completion gaps'; description = 'Audit overdue training completions and assign follow-ups.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(12).ToString('o'); plannedHours=11; actualHours=3; projectId=$createdProjects[1].id; processId=$allProcesses[4].id; assigneeId=$manager.id },
  @{ title = 'Amina Bensalem closes complaint escalation notes'; description = 'Close escalation notes with evidence from the 8D review.'; status='DONE'; dueDate=(Get-Date).AddDays(6).ToString('o'); plannedHours=6; actualHours=6; projectId=$createdProjects[2].id; processId=$allProcesses[1].id; assigneeId=$teamA.id },
  @{ title = 'Youssef Merabet checks line changeover discipline'; description = 'Observe the line changeover and record missed steps.'; status='TODO'; dueDate=(Get-Date).AddDays(20).ToString('o'); plannedHours=10; actualHours=0; projectId=$createdProjects[0].id; processId=$allProcesses[1].id; assigneeId=$teamB.id },
  @{ title = 'Salma Ouassini reviews internal audit evidence'; description = 'Review sampled evidence for the internal audit package.'; status='IN_PROGRESS'; dueDate=(Get-Date).AddDays(8).ToString('o'); plannedHours=13; actualHours=4; projectId=$createdProjects[2].id; processId=$allProcesses[2].id; assigneeId=$teamC.id },
  @{ title = 'Karim Nouri validates document revision release'; description = 'Validate release timing and obsolete document removal.'; status='DONE'; dueDate=(Get-Date).AddDays(5).ToString('o'); plannedHours=7; actualHours=7; projectId=$createdProjects[0].id; processId=$allProcesses[3].id; assigneeId=$teamD.id }
)

$updatedTasks = @()
Update-ListItems $placeholderTasks $taskRenamePayloads $managerToken '/tasks/{0}'
foreach ($payload in $newTaskPayloads) {
  $updatedTasks += (Api-Post '/tasks' $managerToken $payload).data
}

$ncRenamePayloads = @(
  @{ title = 'Supplier sampling plan drift on critical lots'; description = 'Two critical lots were inspected with a sampling deviation on receiving.'; status='OPEN'; severity='HIGH'; detectedAt=(Get-Date).AddDays(-3).ToString('o'); processId=$allProcesses[0].id },
  @{ title = 'Revision mismatch on line A work instruction'; description = 'Operators followed an older instruction revision during a single shift.'; status='ANALYSIS'; severity='MEDIUM'; detectedAt=(Get-Date).AddDays(-6).ToString('o'); processId=$allProcesses[1].id },
  @{ title = 'Audit evidence traceability gap'; description = 'Several audit records lacked a traceability link to the evidence matrix.'; status='OPEN'; severity='CRITICAL'; detectedAt=(Get-Date).AddDays(-2).ToString('o'); processId=$allProcesses[2].id },
  @{ title = 'Label template formatting issue'; description = 'Label formatting was corrected and verified across all stations.'; status='CLOSED'; severity='LOW'; detectedAt=(Get-Date).AddDays(-20).ToString('o'); processId=$allProcesses[1].id }
)

Update-ListItems $placeholderNCs $ncRenamePayloads $adminToken '/non-conformities/{0}'

$newNCs = @(
  @{ title = 'Expired calibration certificate on gauge set'; description = 'One high-use gauge set has an expired calibration certificate.'; status='OPEN'; severity='HIGH'; detectedAt=(Get-Date).AddDays(-1).ToString('o'); processId=$allProcesses[4].id },
  @{ title = 'Training record missing shift B sign-off'; description = 'Shift B competence sign-off is missing for one operator.'; status='ANALYSIS'; severity='MEDIUM'; detectedAt=(Get-Date).AddDays(-5).ToString('o'); processId=$allProcesses[4].id },
  @{ title = 'Packaging pallet scan mismatch'; description = 'A pallet barcode did not match the shipping record during verification.'; status='OPEN'; severity='CRITICAL'; detectedAt=(Get-Date).AddDays(-4).ToString('o'); processId=$allProcesses[3].id },
  @{ title = 'Clause 9.2 evidence gap closed with follow-up'; description = 'Audit evidence gap was reviewed, corrected, and accepted for closure.'; status='CLOSED'; severity='LOW'; detectedAt=(Get-Date).AddDays(-12).ToString('o'); processId=$allProcesses[2].id }
)

$createdNCs = @()
foreach ($n in $newNCs) {
  $createdNCs += (Api-Post '/non-conformities' $adminToken $n).data
}

$capaRenamePayloads = @(
  @{ title = 'Reinforce receiving checklist discipline'; description = 'Deploy a mandatory checklist and supervisor sign-off for critical lots.'; recommendation='Use a visual checklist with shift audit'; actionType='CORRECTIVE'; status='OPEN'; severity='HIGH'; rootCause='Checklist step ambiguity under shift pressure'; containmentAction='100 percent check for next 5 lots'; effectivenessCriteria='No sampling deviations for 30 days'; dueDate=(Get-Date).AddDays(15).ToString('o'); nonConformityId=$placeholderNCs[0].id },
  @{ title = 'Add work instruction revision gate'; description = 'Add a pre-shift revision gate in production startup.'; recommendation='Digital WI validation at line start'; actionType='CORRECTIVE'; status='IN_PROGRESS'; severity='MEDIUM'; rootCause='Revision release communication gap'; containmentAction='Supervisor briefing each shift'; effectivenessCriteria='Zero outdated WI usage for 6 weeks'; dueDate=(Get-Date).AddDays(12).ToString('o'); nonConformityId=$placeholderNCs[1].id },
  @{ title = 'Document evidence ownership matrix'; description = 'Assign evidence ownership and confirm the lifecycle for the audit package.'; recommendation='RACI for evidence lifecycle'; actionType='PREVENTIVE'; status='CANCELLED'; severity='LOW'; rootCause='Overlap with new governance workflow'; containmentAction='Interim spreadsheet tracker'; effectivenessCriteria='Complete ownership coverage'; dueDate=(Get-Date).AddDays(20).ToString('o'); nonConformityId=$placeholderNCs[2].id },
  @{ title = 'Create supplier escalation cadence'; description = 'Create biweekly escalation meetings with top-risk suppliers.'; recommendation='Standing agenda with KPI thresholds'; actionType='PREVENTIVE'; status='OPEN'; severity='MEDIUM'; rootCause='Escalation triggers not formalized'; containmentAction='Interim manual alert threshold'; effectivenessCriteria='Defect trend reduced for 2 consecutive months'; dueDate=(Get-Date).AddDays(25).ToString('o'); nonConformityId=$placeholderNCs[0].id },
  @{ title = 'Auto-validate traceability fields'; description = 'Validate mandatory traceability fields before evidence submission.'; recommendation='Template validation before submission'; actionType='CORRECTIVE'; status='IN_PROGRESS'; severity='CRITICAL'; rootCause='Template allowed blank linkage fields'; containmentAction='Manual QA gate before upload'; effectivenessCriteria='100 percent records with valid trace links'; dueDate=(Get-Date).AddDays(9).ToString('o'); nonConformityId=$placeholderNCs[2].id }
)

Update-ListItems $placeholderCAPAs $capaRenamePayloads $adminToken '/corrective-actions/{0}'

$newCAPAs = @(
  @{ title = 'Finalize gauge certificate recovery'; description='Replace or re-certify expired gauges and document the recheck.'; recommendation='Add monthly expiry dashboard'; actionType='CORRECTIVE'; status='OPEN'; severity='HIGH'; rootCause='Calibration reminders were not escalated'; containmentAction='Remove gauge from service'; effectivenessCriteria='All gauges recertified and tracked'; dueDate=(Get-Date).AddDays(14).ToString('o'); nonConformityId=$createdNCs[0].id },
  @{ title = 'Complete shift B competence sign-off'; description='Close the missing competence record for shift B.'; recommendation='Electronic sign-off after each shift'; actionType='PREVENTIVE'; status='IN_PROGRESS'; severity='MEDIUM'; rootCause='Training matrix update delay'; containmentAction='Supervisor review of current shift'; effectivenessCriteria='All shift sign-offs complete'; dueDate=(Get-Date).AddDays(11).ToString('o'); nonConformityId=$createdNCs[1].id },
  @{ title = 'Stabilize packaging scan verification'; description='Align label scan verification with dispatch records.'; recommendation='Scanner check at packaging exit'; actionType='CORRECTIVE'; status='DONE'; severity='CRITICAL'; rootCause='Barcode template mismatch'; containmentAction='Manual check of current pallet batch'; effectivenessCriteria='Zero scan mismatches for 30 days'; dueDate=(Get-Date).AddDays(8).ToString('o'); nonConformityId=$createdNCs[2].id; effectivenessStatus='VERIFIED'; verifiedById=$caq.id },
  @{ title = 'Close audit evidence gap'; description='Confirm correction and archive updated clause 9.2 evidence.'; recommendation='Audit package checklist'; actionType='CORRECTIVE'; status='DONE'; severity='LOW'; rootCause='Evidence mapping was incomplete'; containmentAction='Evidence map review'; effectivenessCriteria='Evidence pack approved without gaps'; dueDate=(Get-Date).AddDays(7).ToString('o'); nonConformityId=$createdNCs[3].id; effectivenessStatus='VERIFIED'; verifiedById=$admin.id },
  @{ title = 'Formalize supplier escalation rhythm'; description='Set a recurring cadence for supplier risk review.'; recommendation='Biweekly escalation board'; actionType='PREVENTIVE'; status='OPEN'; severity='MEDIUM'; rootCause='No formal cadence for high-risk suppliers'; containmentAction='Manual weekly follow-up'; effectivenessCriteria='Escalations resolved within SLA'; dueDate=(Get-Date).AddDays(18).ToString('o'); nonConformityId=$placeholderNCs[0].id },
  @{ title = 'Release document approval backlog'; description='Approve the held documents and clear the pending release queue.'; recommendation='Document SLA tracking'; actionType='CORRECTIVE'; status='IN_PROGRESS'; severity='LOW'; rootCause='Approvals accumulated during leave period'; containmentAction='Temporary approval triage'; effectivenessCriteria='All documents released within 24 hours'; dueDate=(Get-Date).AddDays(10).ToString('o'); nonConformityId=$placeholderNCs[3].id },
  @{ title = 'Improve training matrix coverage'; description='Close the remaining overdue certifications.'; recommendation='Weekly competence dashboard'; actionType='PREVENTIVE'; status='DONE'; severity='MEDIUM'; rootCause='Training reminders were not tied to due dates'; containmentAction='Escalate overdue certifications now'; effectivenessCriteria='Zero overdue certifications for 60 days'; dueDate=(Get-Date).AddDays(13).ToString('o'); nonConformityId=$createdNCs[1].id; effectivenessStatus='VERIFIED'; verifiedById=$caq.id },
  @{ title = 'Lock packaging traceability controls'; description='Finalize traceability control gates on packaging release.'; recommendation='Traceability gate at final check'; actionType='CORRECTIVE'; status='OPEN'; severity='HIGH'; rootCause='No hard stop when label mismatch occurs'; containmentAction='Hold affected pallets'; effectivenessCriteria='100 percent correct pallet traceability'; dueDate=(Get-Date).AddDays(16).ToString('o'); nonConformityId=$createdNCs[2].id }
)

$createdCAPAs = @()
foreach ($c in $newCAPAs) {
  $createdCAPAs += (Api-Post '/corrective-actions' $adminToken $c).data
}

# Close NCs whose CAPAs were created as DONE/VERIFIED.
Api-Patch "/non-conformities/$($createdNCs[2].id)" $adminToken @{ status = 'CLOSED' } | Out-Null
Api-Patch "/non-conformities/$($createdNCs[3].id)" $adminToken @{ status = 'CLOSED' } | Out-Null
Api-Patch "/non-conformities/$($placeholderNCs[3].id)" $adminToken @{ status = 'CLOSED' } | Out-Null

$summary = [ordered]@{
  renamed = [ordered]@{
    processes = $placeholderProcesses.Count
    projects = $placeholderProjects.Count
    tasks = $placeholderTasks.Count
    nonConformities = $placeholderNCs.Count
    correctiveActions = $placeholderCAPAs.Count
  }
  created = [ordered]@{
    processes = $createdProcesses.Count
    projects = $createdProjects.Count
    tasks = $newTaskPayloads.Count
    nonConformities = $createdNCs.Count
    correctiveActions = $createdCAPAs.Count
  }
  totals = [ordered]@{
    processes = $allProcesses.Count
    projects = $allProjects.Count
    tasks = (($placeholderTasks.Count) + ($newTaskPayloads.Count))
    nonConformities = (($placeholderNCs.Count) + ($createdNCs.Count))
    correctiveActions = (($placeholderCAPAs.Count) + ($createdCAPAs.Count))
  }
  taskStatusBreakdown = ((Api-Get '/tasks' $managerToken).data | Group-Object status | ForEach-Object { [ordered]@{ status = $_.Name; count = $_.Count } })
  projectStatusSample = ((Api-Get '/projects' $adminToken).data | Select-Object -First 6 | ForEach-Object { [ordered]@{ name = $_.name; progress = $_.progress; status = $_.computedStatus } })
  ncStatusBreakdown = ((Api-Get '/non-conformities' $adminToken).data | Group-Object status | ForEach-Object { [ordered]@{ status = $_.Name; count = $_.Count } })
  capaStatusBreakdown = ((Api-Get '/corrective-actions' $adminToken).data | Group-Object status | ForEach-Object { [ordered]@{ status = $_.Name; count = $_.Count } })
}

$summary | ConvertTo-Json -Depth 8
