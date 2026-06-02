const assert = require("node:assert/strict");
const test = require("node:test");
const { runBootstrap, trackNextSteps } = require("./contributor-bootstrap.js");

test("trackNextSteps returns track-aware guidance", () => {
  assert.deepEqual(trackNextSteps("be"), [
    "Run `npm run lint --prefix backend`",
    "Run `npm run typecheck --prefix backend`",
    "Run `npm run test --prefix backend -- --runInBand`",
  ]);
});

test("runBootstrap returns a structured result", () => {
  const result = runBootstrap("all");
  assert.equal(typeof result.ok, "boolean");
  assert.equal(result.track, "all");
  assert.equal(Array.isArray(result.checks), true);
  assert.equal(Array.isArray(result.nextSteps), true);
});
