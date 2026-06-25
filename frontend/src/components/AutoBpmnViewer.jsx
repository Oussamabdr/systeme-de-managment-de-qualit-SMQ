import { useEffect, useRef } from "react";
import BpmnViewer from "bpmn-js/lib/Viewer";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildBpmnXml(processData) {
  const inputs = Array.isArray(processData.inputs) ? processData.inputs : [];
  const objectives = Array.isArray(processData.objectives) ? processData.objectives : [];
  const outputs = Array.isArray(processData.outputs) ? processData.outputs : [];

  const name = escapeXml(processData.name || "Process");

  const nodes = [];
  const shapes = [];
  const edges = [];

  const START_W = 36;
  const START_H = 36;
  const TASK_W = 100;
  const TASK_H = 80;
  const END_W = 36;
  const END_H = 36;
  const SPACING = 150; // Reduced spacing since arrows look better tighter
  const BASE_CANVAS_Y = 200;

  const getTopLeftY = (elementType) => {
    if (elementType === "task") return BASE_CANVAS_Y - TASK_H / 2;
    return BASE_CANVAS_Y - START_H / 2;
  };

  // Pre-calculate IDs to establish structural incoming/outgoing links
  const startId = "StartEvent_1";
  const endId = "EndEvent_1";
  const taskIds = objectives.length > 0 
    ? objectives.map((_, i) => `Task_${i + 1}`) 
    : ["Task_Execute"];

  // Chain all IDs together to easily map flows
  const orderedElementIds = [startId, ...taskIds, endId];
  
  // Track structural flows for each node
  const nodeConnections = {};
  orderedElementIds.forEach(id => {
    nodeConnections[id] = { incoming: [], outgoing: [] };
  });

  // Generate flows and populate connections
  for (let i = 0; i < orderedElementIds.length - 1; i++) {
    const sourceId = orderedElementIds[i];
    const targetId = orderedElementIds[i + 1];
    const flowId = `Flow_${sourceId}_${targetId}`;
    
    nodeConnections[sourceId].outgoing.push(flowId);
    nodeConnections[targetId].incoming.push(flowId);
  }

  let x = 100;

  // 1. START EVENT
  const startLabel = escapeXml(inputs.length > 0 ? inputs.join(", ") : "Start");
  const startY = getTopLeftY("event");
  const startIncomingTags = nodeConnections[startId].incoming.map(f => `<bpmn:incoming>${f}</bpmn:incoming>`).join("");
  const startOutgoingTags = nodeConnections[startId].outgoing.map(f => `<bpmn:outgoing>${f}</bpmn:outgoing>`).join("");
  
  nodes.push(`<bpmn:startEvent id="${startId}" name="${startLabel}">${startIncomingTags}${startOutgoingTags}</bpmn:startEvent>`);
  shapes.push(
    `<bpmndi:BPMNShape id="${startId}_di" bpmnElement="${startId}">` +
      `<omgdc:Bounds x="${x}" y="${startY}" width="${START_W}" height="${START_H}" />` +
      `</bpmndi:BPMNShape>`
  );

  let prevBounds = { x, y: startY, width: START_W, height: START_H };
  x += START_W + SPACING;

  // 2. TASKS
  if (objectives.length > 0) {
    objectives.forEach((obj, index) => {
      const taskId = taskIds[index];
      const taskY = getTopLeftY("task");
      const incomingTags = nodeConnections[taskId].incoming.map(f => `<bpmn:incoming>${f}</bpmn:incoming>`).join("");
      const outgoingTags = nodeConnections[taskId].outgoing.map(f => `<bpmn:outgoing>${f}</bpmn:outgoing>`).join("");

      nodes.push(`<bpmn:task id="${taskId}" name="${escapeXml(obj)}">${incomingTags}${outgoingTags}</bpmn:task>`);
      shapes.push(
        `<bpmndi:BPMNShape id="${taskId}_di" bpmnElement="${taskId}">` +
          `<omgdc:Bounds x="${x}" y="${taskY}" width="${TASK_W}" height="${TASK_H}" />` +
          `</bpmndi:BPMNShape>`
      );

      const taskBounds = { x, y: taskY, width: TASK_W, height: TASK_H };
      const flowId = nodeConnections[taskId].incoming[0];
      
      edges.push(
        `<bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">` +
          `<omgdi:Waypoint x="${prevBounds.x + prevBounds.width}" y="${prevBounds.y + prevBounds.height / 2}" />` +
          `<omgdi:Waypoint x="${taskBounds.x}" y="${taskBounds.y + taskBounds.height / 2}" />` +
          `</bpmndi:BPMNEdge>`
      );

      prevBounds = taskBounds;
      x += TASK_W + SPACING;
    });
  } else {
    const taskId = "Task_Execute";
    const taskY = getTopLeftY("task");
    const incomingTags = nodeConnections[taskId].incoming.map(f => `<bpmn:incoming>${f}</bpmn:incoming>`).join("");
    const outgoingTags = nodeConnections[taskId].outgoing.map(f => `<bpmn:outgoing>${f}</bpmn:outgoing>`).join("");

    nodes.push(`<bpmn:task id="${taskId}" name="Execute Process">${incomingTags}${outgoingTags}</bpmn:task>`);
    shapes.push(
      `<bpmndi:BPMNShape id="${taskId}_di" bpmnElement="${taskId}">` +
        `<omgdc:Bounds x="${x}" y="${taskY}" width="${TASK_W}" height="${TASK_H}" />` +
        `</bpmndi:BPMNShape>`
    );

    const taskBounds = { x, y: taskY, width: TASK_W, height: TASK_H };
    const flowId = nodeConnections[taskId].incoming[0];

    edges.push(
      `<bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">` +
        `<omgdi:Waypoint x="${prevBounds.x + prevBounds.width}" y="${prevBounds.y + prevBounds.height / 2}" />` +
        `<omgdi:Waypoint x="${taskBounds.x}" y="${taskBounds.y + taskBounds.height / 2}" />` +
        `</bpmndi:BPMNEdge>`
    );

    prevBounds = taskBounds;
    x += TASK_W + SPACING;
  }

  // 3. END EVENT
  const endLabel = escapeXml(outputs.length > 0 ? outputs.join(", ") : "End");
  const endY = getTopLeftY("event");
  const endIncomingTags = nodeConnections[endId].incoming.map(f => `<bpmn:incoming>${f}</bpmn:incoming>`).join("");
  const endOutgoingTags = nodeConnections[endId].outgoing.map(f => `<bpmn:outgoing>${f}</bpmn:outgoing>`).join("");

  nodes.push(`<bpmn:endEvent id="${endId}" name="${endLabel}">${endIncomingTags}${endOutgoingTags}</bpmn:endEvent>`);
  shapes.push(
    `<bpmndi:BPMNShape id="${endId}_di" bpmnElement="${endId}">` +
      `<omgdc:Bounds x="${x}" y="${endY}" width="${END_W}" height="${END_H}" />` +
      `</bpmndi:BPMNShape>`
  );

  const finalFlowId = nodeConnections[endId].incoming[0];
  edges.push(
    `<bpmndi:BPMNEdge id="${finalFlowId}_di" bpmnElement="${finalFlowId}">` +
      `<omgdi:Waypoint x="${prevBounds.x + prevBounds.width}" y="${prevBounds.y + prevBounds.height / 2}" />` +
      `<omgdi:Waypoint x="${x}" y="${endY + END_H / 2}" />` +
      `</bpmndi:BPMNEdge>`
  );

  // 4. APPEND SEQUENCE FLOW STRUCTURAL ELEMENTS TO NODES ARRAY
  orderedElementIds.forEach(id => {
    nodeConnections[id].outgoing.forEach(flowId => {
      const targetId = orderedElementIds[orderedElementIds.indexOf(id) + 1];
      nodes.push(`<bpmn:sequenceFlow id="${flowId}" sourceRef="${id}" targetRef="${targetId}" />`);
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
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

  return xml;
}

export default function AutoBpmnViewer({ processData }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !processData) return;

    const viewer = new BpmnViewer({
      container: containerRef.current,
      width: "100%",
      height: "100%",
    });

    viewerRef.current = viewer;

    const xml = buildBpmnXml(processData);

    viewer.importXML(xml).then(() => {
      const canvas = viewer.get("canvas");
      canvas.zoom("fit-viewport", { x: 0, y: 0 });
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [processData]);

  if (!processData) return null;

  return (
    <section
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "0.5rem",
        background: "#fafafa",
        height: "350px",
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </section>
  );
}