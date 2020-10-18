// Layout
const OFFSET = { x: 10, y: 100 };

const CODELINE_1Y = 40;
const CODELINE_2Y = 82;
const INPUT_RANGE_Y = 200;
const OUTPUT_RANGE_Y = 420;
const OUTPUT_LABEL_Y = 500;

const BG_COLOR = "#343741";
const IN_RANGE_COLOR = "#8ca7f8";
const IN_VALUE_COLOR = "#B79CB6"; // lerpColor(color("#875A86"), color("white"), 0.4)
const OUT_RANGE_COLOR = "#76CBA6";
const OUT_VALUE_COLOR = "#CCCC00";

let inputControl, inLowControl, inHighControl, outLowControl, outHighControl;
let controls = [];

let draggedControl = null;
let clampCheckbox;

const presets = [
  [0, 100, 0, 100],
  [0, 100, 100, 200],
  [0, 100, 50, 150],
  [0, 100, 50, 250],
  [0, 100, 100, 0],
  [0, 100, 0, 1000],
  [50, 150, 100, 300],
  [0, 1023, 0, 255],
  [0, 1023, 255, 0],
];

const P5JS_FRAMEWORK = "p5.js";
const frameworks = {
  Arduino: { varDef: "int" },
  Processing: { varDef: "float" },
  [P5JS_FRAMEWORK]: { varDef: "let", hasClamp: true },
};
let frameworkName = P5JS_FRAMEWORK;

const referenceUrls = [
  [
    "https://www.arduino.cc/reference/en/language/functions/math/map/",
    "Arduino reference",
  ],
  ["https://processing.org/reference/map_.html", "Processing reference"],
  ["https://p5js.org/reference/#/p5/map", "p5.js reference"],
];

// Convert between program values and canvas X values.
// This doesn't use `scale` and `translate`, because we only want
// to transform the x positions, not the widths of text and shapes.
let xAdd = 0;
let xScale = 4;

const toCanvasX = (x) => xAdd + x * xScale;
const fromCanvasX = (xAdd) => (mouseX - xAdd) / xScale;

const formatNumber = (n) => String(n).replace(/(\.\d{2})\d+/, "$1");

function setup() {
  createCanvas(windowWidth, windowHeight - 40);
  createControllers();
  createFrameworkSelector();

  clampCheckbox = createCheckbox("clamp", false);
  clampCheckbox
    .position(180, OFFSET.y + 40)
    .style("color", "white")
    .attribute("title", "Clamp the output between low and high");

  createPresets();
  createReferenceLinks();
  createA("https://github.com/osteele/map-explorer", "Edit on GitHub")
    .position(width - 140, height - 30)
    .style('color', 'gray')
}

function createFrameworkSelector() {
  createDiv("Framework")
    .position(20, OFFSET.y)
    .style("color", "white")
    .style("font-size", "26px");
  let frameworkSel = createSelect().position(20, OFFSET.y + 40);
  Object.keys(frameworks).forEach((s) => frameworkSel.option(s));
  frameworkSel.selected(P5JS_FRAMEWORK);
  frameworkSel.changed(() => {
    frameworkName = frameworkSel.value();
    let { hasClamp } = frameworks[frameworkName];
    if (hasClamp) clampCheckbox.show();
    else clampCheckbox.hide();
  });
}

function createControllers() {
  inLowControl = new Controller(10, INPUT_RANGE_Y, IN_RANGE_COLOR, "input low");
  inHighControl = new Controller(40, INPUT_RANGE_Y, IN_RANGE_COLOR, "input high");
  inputControl = new Controller(15, INPUT_RANGE_Y, IN_VALUE_COLOR, "input");
  outLowControl = new Controller(
    100,
    OUTPUT_RANGE_Y,
    OUT_RANGE_COLOR,
    "output low"
  );
  outHighControl = new Controller(
    200,
    OUTPUT_RANGE_Y,
    OUT_RANGE_COLOR,
    "output high"
  );
}

function createReferenceLinks() {
  let y = height - 70;
  for (let [href, title] of referenceUrls) {
    createA(href, title, "map-reference")
      .position(20, y)
      .style("color", "gray");
    y += 20;
  }
}

function createPresets() {
  const controls = [
    inLowControl,
    inHighControl,
    outLowControl,
    outHighControl,
  ];
  const top = OFFSET.y + 10;
  let x = width - 300;
  let y = top;
  createDiv("Presets").position(x, y).style("color", "white");
  presets.forEach((preset, i) => {
    const [s1, e1, s2, e2] = preset;
    y += 22;
    // two columns:
    if (i === floor(presets.length / 2)) {
      x += 150;
      y = top;
    }
    createButton(`${s1}, ${e1} → ${s2}, ${e2}`).position(x, y)
      .style('background', 'gray')
      .style('border', 'none')
      .mousePressed(() => {
        controls.forEach((control, i) => (control.value = preset[i]));
        inputControl.value = constrain(inputControl.value, s1, e1);
      });
  });
}

function draw() {
  background(BG_COLOR);

  const { varDef: declarator, hasClamp } = frameworks[frameworkName];
  const clamp = Boolean(hasClamp && clampCheckbox.checked());
  const toTargetType = declarator === "int" ? floor : (x) => x;

  const inLow = toTargetType(inLowControl.value);
  const inHigh = toTargetType(inHighControl.value);
  const outLow = toTargetType(outLowControl.value);
  const outHigh = toTargetType(outHighControl.value);
  const x = toTargetType(inputControl.value);
  const y = toTargetType(map(x, inLow, inHigh, outLow, outHigh, clamp));

  if (updateCanvasMapping([x, y, inLow, inHigh, outLow, outHigh]) || coachMarkIndex >= 0) {
    loop();
  } else {
    noLoop();
  }

  push();
  translate(OFFSET.x, OFFSET.y);
  strokeCap(SQUARE);

  textSize(30);
  textFont("Courier");
  fill("#ccc");
  const codeSpans = [
    `${declarator} output = map(`,
    `input, `,
    `${formatNumber(inLow)}, ${formatNumber(inHigh)}`,
    ", ",
    `${formatNumber(outLow)}, ${formatNumber(outHigh)}`,
    (clamp ? ", true" : "") + ");",
  ];
  const codeSpanWidths = codeSpans.map((s) => textWidth(s));
  const inValueLeft = codeSpanWidths[0] + 10;
  const inValueWidth = codeSpanWidths[1];
  const inTextLeft = inValueLeft + codeSpanWidths[1];
  const inTextRight = inTextLeft + codeSpanWidths[2];
  const outTextLeft = inTextRight + codeSpanWidths[3];
  const outTextRight = outTextLeft + codeSpanWidths[4];
  text(`${declarator} input = ${formatNumber(x)};`, 10, CODELINE_1Y);
  text(codeSpans.join(""), 10, CODELINE_2Y);
  fill(OUT_VALUE_COLOR);
  text("output", 10 + textWidth(`${declarator} `), CODELINE_2Y);
  fill(IN_VALUE_COLOR);
  text("input", 10 + textWidth(`${declarator} `), CODELINE_1Y);
  text("input", inValueLeft, CODELINE_2Y);
  fill(IN_RANGE_COLOR);
  text(codeSpans[2], inTextLeft, CODELINE_2Y);
  fill(OUT_RANGE_COLOR);
  text(codeSpans[4], outTextLeft, CODELINE_2Y);

  textAlign(CENTER);

  // lines from inLow-outLow, inHigh-outHigh, input-output
  strokeWeight(4);
  stroke("#575A66");
  line(inLowControl.x, inLowControl.y, outLowControl.x, outLowControl.y);
  line(inHighControl.x, inHighControl.y, outHighControl.x, outHighControl.y);
  stroke("white");
  line(toCanvasX(x), INPUT_RANGE_Y, toCanvasX(y), OUTPUT_RANGE_Y);

  // input range lines and labels
  textSize(15);
  stroke(IN_RANGE_COLOR);
  fill(IN_RANGE_COLOR);
  strokeWeight(4);
  line(inTextLeft, CODELINE_2Y + 10, inTextRight, CODELINE_2Y + 10);
  strokeWeight(8);
  line(inLowControl.x, inLowControl.y, inHighControl.x, inHighControl.y);
  strokeWeight(0);
  text(formatNumber(inLow), inLowControl.x, inLowControl.y - 10);
  text(formatNumber(inHigh), inHighControl.x, inHighControl.y - 10);

  // line from input value to the input bar
  stroke(IN_VALUE_COLOR);
  strokeWeight(2);
  line(
    inValueLeft + inValueWidth / 2 - 10,
    CODELINE_2Y + 10,
    toCanvasX(x),
    INPUT_RANGE_Y
  );

  // output range lines and labels
  stroke(OUT_RANGE_COLOR);
  fill(OUT_RANGE_COLOR);
  strokeWeight(4);
  line(outTextLeft, CODELINE_2Y + 10, outTextRight, CODELINE_2Y + 10);
  strokeWeight(8);
  strokeCap(SQUARE);
  line(outLowControl.x, outLowControl.y, outHighControl.x, outHighControl.y);
  strokeWeight(0);
  text(formatNumber(outLow), outLowControl.x, outLowControl.y - 10);
  text(formatNumber(outHigh), outHighControl.x, outHighControl.y - 10);

  // line from output value to label
  fill(OUT_VALUE_COLOR);
  stroke(OUT_VALUE_COLOR);
  strokeWeight(2);
  line(toCanvasX(y), OUTPUT_RANGE_Y, toCanvasX(y), OUTPUT_LABEL_Y - 30);
  textSize(30);
  text(formatNumber(y), toCanvasX(y), OUTPUT_LABEL_Y);

  for (const control of controls) {
    const [r, g, b] = control.color.levels;
    const alpha = control.containsMouse()
      || control === draggedControl
      || control === currentCoachMark ? 255 : 100;
    fill(r, g, b, alpha);
    noStroke();
    circle(control.x, control.y, 20);
  }
  if (!draggedControl) {
    drawCoachMarks();
  }

  pop();
}

function updateCanvasMapping(xs) {
  const xMin = min(xs);
  const xMax = max(xs);
  const margin = 30;
  let settled = true;

  function interp(s0, t) {
    const s1 = lerp(s0, t, 0.1);
    return abs(s1 - s0) < 2 ? lerp(s0, t, 0.2) : s1;
  }

  if (toCanvasX(xMin) < margin || (!draggedControl && toCanvasX(xMin) > 2 * margin)) {
    xAdd = interp(xAdd, margin - xMin * xScale);
    settled = false;
  }
  if (
    toCanvasX(xMax) > width - margin ||
    (!draggedControl && toCanvasX(xMax) < width - 4 * margin)
  ) {
    xScale = interp(xScale, (width - margin - xAdd) / xMax);
    settled = false;
  }
  return !settled;
}

function mousePressed() {
  disableCouchMarks();
  draggedControl = controls.find(control => control.containsMouse())
}

function mouseDragged() {
  if (draggedControl) {
    draggedControl.value = fromCanvasX(xAdd + 10);
    redraw();
  }
}

function mouseMoved() { redraw(); }

function mouseReleased() {
  draggedControl = null;
}

class Controller {
  constructor(value, y, c, label) {
    this.value = value;
    this.y = y;
    this.color = color(c);
    this.label = label;
    controls.push(this);
  }

  get x() {
    return toCanvasX(this.value);
  }

  containsMouse() {
    const radius = 10;
    return (this.x - mouseX + OFFSET.x) ** 2 + (this.y - mouseY + OFFSET.y) ** 2 < radius ** 2;
  }
}
