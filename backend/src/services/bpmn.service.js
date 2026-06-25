const prisma = require("../config/prisma");

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildInitialXml(process) {
  const name = escapeXml(process.name || "Process");
  const inputs = Array.isArray(process.inputs) ? process.inputs : [];
  const objectives = Array.isArray(process.objectives) ? process.objectives : [];
  const outputs = Array.isArray(process.outputs) ? process.outputs : [];

  const START_W = 36;
  const START_H = 36;
  const TASK_W = 100;
  const TASK_H = 80;
  const END_W = 36;
  const END_H = 36;
  const SPACING = 160;
  const BASE_Y = 200;

  const startId = "StartEvent_1";
  const endId = "EndEvent_1";
  const taskIds = objectives.length > 0
    ? objectives.map((_, i) => `Task_${i + 1}`)
    : ["Task_Execute"];

  const allIds = [startId, ...taskIds, endId];

  const nodes = [];
  const shapes = [];
  const edges = [];

  let x = 120;

  const startLabel = escapeXml(inputs.length > 0 ? inputs.join(", ") : "Start");
  nodes.push(`<bpmn:startEvent id="${startId}" name="${startLabel}"><bpmn:outgoing>Flow_1</bpmn:outgoing></bpmn:startEvent>`);
  shapes.push(
    `<bpmndi:BPMNShape id="${startId}_di" bpmnElement="${startId}">` +
      `<omgdc:Bounds x="${x}" y="${BASE_Y - START_H / 2}" width="${START_W}" height="${START_H}" />` +
      `<bpmndi:BPMNLabel><omgdc:Bounds x="${x - 40}" y="${BASE_Y - START_H / 2 + START_H + 6}" width="116" height="24" /></bpmndi:BPMNLabel>` +
    `</bpmndi:BPMNShape>`
  );

  let prevX = x + START_W;
  let prevId = startId;

  taskIds.forEach((taskId, i) => {
    const obj = objectives[i] || "Execute Process";
    x = 120 + (i + 1) * (TASK_W + SPACING);
    const flowId = `Flow_${i + 1}`;
    const nextFlowId = i < taskIds.length - 1 ? `Flow_${i + 2}` : null;

    const outTag = nextFlowId ? `<bpmn:outgoing>${nextFlowId}</bpmn:outgoing>` : "";
    nodes.push(`<bpmn:task id="${taskId}" name="${escapeXml(obj)}"><bpmn:incoming>${flowId}</bpmn:incoming>${outTag}</bpmn:task>`);
    shapes.push(
      `<bpmndi:BPMNShape id="${taskId}_di" bpmnElement="${taskId}">` +
        `<omgdc:Bounds x="${x}" y="${BASE_Y - TASK_H / 2}" width="${TASK_W}" height="${TASK_H}" />` +
      `</bpmndi:BPMNShape>`
    );

    edges.push(
      `<bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">` +
        `<omgdi:waypoint x="${prevX}" y="${BASE_Y}" />` +
        `<omgdi:waypoint x="${x}" y="${BASE_Y}" />` +
      `</bpmndi:BPMNEdge>`
    );
    nodes.push(`<bpmn:sequenceFlow id="${flowId}" sourceRef="${prevId}" targetRef="${taskId}" />`);

    prevX = x + TASK_W;
    prevId = taskId;
  });

  x = 120 + (taskIds.length + 1) * (TASK_W + SPACING);
  const endLabel = escapeXml(outputs.length > 0 ? outputs.join(", ") : "End");
  const lastFlowId = `Flow_${taskIds.length + 1}`;
  nodes.push(`<bpmn:endEvent id="${endId}" name="${endLabel}"><bpmn:incoming>${lastFlowId}</bpmn:incoming></bpmn:endEvent>`);
  shapes.push(
    `<bpmndi:BPMNShape id="${endId}_di" bpmnElement="${endId}">` +
      `<omgdc:Bounds x="${x}" y="${BASE_Y - END_H / 2}" width="${END_W}" height="${END_H}" />` +
      `<bpmndi:BPMNLabel><omgdc:Bounds x="${x - 40}" y="${BASE_Y - END_H / 2 + END_H + 6}" width="116" height="24" /></bpmndi:BPMNLabel>` +
    `</bpmndi:BPMNShape>`
  );
  edges.push(
    `<bpmndi:BPMNEdge id="${lastFlowId}_di" bpmnElement="${lastFlowId}">` +
      `<omgdi:waypoint x="${prevX}" y="${BASE_Y}" />` +
      `<omgdi:waypoint x="${x}" y="${BASE_Y}" />` +
    `</bpmndi:BPMNEdge>`
  );
  nodes.push(`<bpmn:sequenceFlow id="${lastFlowId}" sourceRef="${prevId}" targetRef="${endId}" />`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" name="${name}" isExecutable="false">
    ${nodes.join("\n    ")}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      ${edges.join("\n      ")}
      ${shapes.join("\n      ")}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

async function getProcessBpmn(processId) {
  const process = await prisma.process.findUnique({
    where: { id: processId },
    select: { id: true, name: true, inputs: true, objectives: true, outputs: true, bpmnXml: true },
  });
  if (!process) return null;

  if (process.bpmnXml) return process.bpmnXml;

  const xml = buildInitialXml(process);
  await prisma.process.update({
    where: { id: processId },
    data: { bpmnXml: xml },
  });
  return xml;
}

async function saveProcessBpmn(processId, xml) {
  await prisma.process.update({
    where: { id: processId },
    data: { bpmnXml: xml },
  });
}

module.exports = { getProcessBpmn, saveProcessBpmn };
