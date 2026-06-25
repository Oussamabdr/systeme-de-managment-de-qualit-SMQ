import { useEffect, useRef, useState } from "react";
import BpmnModelerLib from "bpmn-js/lib/Modeler";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

export default function BpmnModeler({ xml, onSave, height = "600px" }) {
  const containerRef = useRef(null);
  const modelerRef = useRef(null);
  const [changed, setChanged] = useState(false);
  const [importing, setImporting] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const modeler = new BpmnModelerLib({
      container: containerRef.current,
      width: "100%",
      height: "100%",
    });

    modelerRef.current = modeler;

    function handleChanged() {
      setChanged(true);
    }

    modeler.on("commandStack.changed", handleChanged);

    async function init() {
      setImporting(true);
      try {
        await modeler.importXML(xml || defaultEmptyXml());
        const canvas = modeler.get("canvas");
        canvas.zoom("fit-viewport");
      } catch (err) {
        console.error("BPMN import error", err);
      } finally {
        setImporting(false);
      }
    }

    init();

    return () => {
      modeler.off("commandStack.changed", handleChanged);
      modeler.destroy();
      modelerRef.current = null;
    };
  }, [xml]);

  async function handleSave() {
    if (!modelerRef.current) return;
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      onSave?.(xml);
      setChanged(false);
    } catch (err) {
      console.error("BPMN save error", err);
    }
  }

  async function handleDownload() {
    if (!modelerRef.current) return;
    try {
      const { svg } = await modelerRef.current.saveSVG();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diagram.svg";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("BPMN download error", err);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          className="saas-btn saas-btn-primary"
          disabled={!changed || importing}
          onClick={handleSave}
        >
          {importing ? "Loading..." : "Save Diagram"}
        </button>
        <button
          className="saas-btn saas-btn-subtle"
          onClick={handleDownload}
        >
          Export SVG
        </button>
        {changed && !importing && (
          <span className="self-center text-xs text-amber-600 font-medium">
            Unsaved changes
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height,
          border: "1px solid #e2e8f0",
          borderRadius: "0.5rem",
          background: "#fafafa",
        }}
      />
    </div>
  );
}

function defaultEmptyXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" name="New Process" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Activity">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <omgdi:waypoint x="188" y="160" />
        <omgdi:waypoint x="290" y="160" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <omgdi:waypoint x="430" y="160" />
        <omgdi:waypoint x="532" y="160" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <omgdc:Bounds x="152" y="142" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <omgdc:Bounds x="290" y="120" width="140" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <omgdc:Bounds x="532" y="142" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
