import test from "node:test";
import assert from "node:assert/strict";
import { renderTemplate, projectBoxToView } from "../interpreter.js";
import { BUILTIN_TEMPLATES } from "../builtin-templates.js";

test("renderTemplate returns resolved boxes from builtin templates", () => {
  const template = BUILTIN_TEMPLATES.find((tpl) => tpl.id === "wall-cabinet-2door");
  const boxes = renderTemplate(template, { params: { width: 100, height: 75, depth: 40 } }, "front", "wood-oak");
  assert.ok(boxes.length >= 1);
  assert.deepEqual(
    { x: boxes[0].x, y: boxes[0].y, z: boxes[0].z, w: boxes[0].w, h: boxes[0].h, d: boxes[0].d },
    { x: 0, y: 0, z: 0, w: 100, h: 75, d: 40 }
  );
});

test("projectBoxToView maps front projection with depth key", () => {
  assert.deepEqual(
    projectBoxToView({ x: 10, y: 20, z: 30, w: 80, h: 75, d: 35, faces: { front: "#ff0000" } }, "front"),
    { x: 10, y: 20, w: 80, h: 75, fill: "#ff0000", depthKey: 30 }
  );
});

test("renderTemplate keeps raw out-of-range params and reports advisory warnings", () => {
  const warnings = [];
  const template = {
    params: { height: { min: 60, max: 120, default: 80 }, width: { default: 50 }, depth: { default: 30 } },
    boxes: [{ x: 0, y: 0, z: 0, w: "{{width}}", h: "{{height}}", d: "{{depth}}" }]
  };
  const boxes = renderTemplate(template, { params: { height: 45 }, warnings }, "front", "wood-oak");
  assert.equal(boxes[0].h, 45);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /height/);
});
