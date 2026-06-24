import { useEffect, useRef } from "react";
import BpmnViewer from "bpmn-js/lib/Viewer";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

function buildBpmnXml(processData) {
  const inputs = Array.isArray(processData.inputs) ? processData.inputs : [];
  const objectives = Array.isArray(processData.objectives) ? processData.objectives : [];
  const outputs = Array.isArray(processData.outputs) ? processData.outputs : [];

  const name = processData.name || "Process";

  const nodes = [];
  const shapes = [];
  const edges = [];

  const START_W = 36;
  const START_H = 36;
  const TASK_W = 100;
  const TASK_H = 80;
  const END_W = 36;
  const END_H = 36;
  const SPACING = 260;
  const BASE_CANVAS_Y = 200;

  const getTopLeftY = (elementType) => {
    if (elementType === "task") return BASE_CANVAS_Y - TASK_H / 2;
    return BASE_CANVAS_Y - START_H / 2;
  };

  let x = 100;

  const startId = "StartEvent_1";
  const startLabel = inputs.length > 0 ? inputs.join(", ") : "Start";
  nodes.push(`<bpmn:startEvent id="${startId}" name="${startLabel}">`);
  nodes.push(`</bpmn:startEvent>`);
  const startY = getTopLeftY("event");
  const startX = x;
  shapes.push(
    `<bpmndi:BPMNShape id="${startId}_di" bpmnElement="${startId}">` +
      `<omgdc:Bounds x="${x}" y="${startY}" width="${START_W}" height="${START_H}" />` +
      `</bpmndi:BPMNShape>`,
  );
  const startRight = x + START_W;

  x = startRight + SPACING;
  let prevId = startId;
  let prevBounds = { x: startX, y: startY, width: START_W, height: START_H };

  if (objectives.length > 0) {
    objectives.forEach((obj, index) => {
      const taskId = `Task_${index + 1}`;
      nodes.push(`<bpmn:task id="${taskId}" name="${obj}">`);
      nodes.push(`</bpmn:task>`);
      const taskY = getTopLeftY("task");
      shapes.push(
        `<bpmndi:BPMNShape id="${taskId}_di" bpmnElement="${taskId}">` +
          `<omgdc:Bounds x="${x}" y="${taskY}" width="${TASK_W}" height="${TASK_H}" />` +
          `</bpmndi:BPMNShape>`,
      );
      const taskBounds = { x, y: taskY, width: TASK_W, height: TASK_H };

      const flowId = `Flow_${prevId}_${taskId}`;
      nodes.push(`<bpmn:sequenceFlow id="${flowId}" sourceRef="${prevId}" targetRef="${taskId}" />`);
      const sourceEndX = prevBounds.x + prevBounds.width + 2;
      const sourceCenterY = prevBounds.y + prevBounds.height / 2;
      const targetStartX = taskBounds.x - 2;
      const targetCenterY = taskBounds.y + taskBounds.height / 2;
      edges.push(
        `<bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">` +
          `<omgdc:Waypoint x="${sourceEndX}" y="${sourceCenterY}" />` +
          `<omgdc:Waypoint x="${targetStartX}" y="${targetCenterY}" />` +
          `</bpmndi:BPMNEdge>`,
      );

      prevId = taskId;
      prevBounds = taskBounds;
      x = taskBounds.x + taskBounds.width + SPACING;
    });
  } else {
    const taskId = "Task_Execute";
    nodes.push(`<bpmn:task id="${taskId}" name="Execute Process">`);
    nodes.push(`</bpmn:task>`);
    const taskY = getTopLeftY("task");
    shapes.push(
      `<bpmndi:BPMNShape id="${taskId}_di" bpmnElement="${taskId}">` +
        `<omgdc:Bounds x="${x}" y="${taskY}" width="${TASK_W}" height="${TASK_H}" />` +
        `</bpmndi:BPMNShape>`,
    );
    const taskBounds = { x, y: taskY, width: TASK_W, height: TASK_H };

    const flowId = `Flow_${prevId}_${taskId}`;
    nodes.push(`<bpmn:sequenceFlow id="${flowId}" sourceRef="${prevId}" targetRef="${taskId}" />`);
    const sourceEndX = prevBounds.x + prevBounds.width + 2;
    const sourceCenterY = prevBounds.y + prevBounds.height / 2;
    const targetStartX = taskBounds.x - 2;
    const targetCenterY = taskBounds.y + taskBounds.height / 2;
    edges.push(
      `<bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">` +
        `<omgdc:Waypoint x="${sourceEndX}" y="${sourceCenterY}" />` +
        `<omgdc:Waypoint x="${targetStartX}" y="${targetCenterY}" />` +
        `</bpmndi:BPMNEdge>`,
    );

    prevId = taskId;
    prevBounds = taskBounds;
    x = taskBounds.x + taskBounds.width + SPACING;
  }

  const endId = "EndEvent_1";
  const endLabel = outputs.length > 0 ? outputs.join(", ") : "End";
  nodes.push(`<bpmn:endEvent id="${endId}" name="${endLabel}">`);
  nodes.push(`</bpmn:endEvent>`);
  const endY = getTopLeftY("event");
  shapes.push(
    `<bpmndi:BPMNShape id="${endId}_di" bpmnElement="${endId}">` +
      `<omgdc:Bounds x="${x}" y="${endY}" width="${END_W}" height="${END_H}" />` +
      `</bpmndi:BPMNShape>`,
  );
  const endBounds = { x, y: endY, width: END_W, height: END_H };

  const flowId = `Flow_${prevId}_${endId}`;
  nodes.push(`<bpmn:sequenceFlow id="${flowId}" sourceRef="${prevId}" targetRef="${endId}" />`);
  const sourceEndX = prevBounds.x + prevBounds.width + 2;
  const sourceCenterY = prevBounds.y + prevBounds.height / 2;
  const targetStartX = endBounds.x - 2;
  const targetCenterY = endBounds.y + endBounds.height / 2;
  edges.push(
    `<bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">` +
      `<omgdc:Waypoint x="${sourceEndX}" y="${sourceCenterY}" />` +
      `<omgdc:Waypoint x="${targetStartX}" y="${targetCenterY}" />` +
      `</bpmndi:BPMNEdge>`,
  );

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
      ${shapes.join("\n      ")}
      ${edges.join("\n      ")}
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
      canvas.zoom("fit-viewport");
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
