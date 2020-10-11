let inputControl, inLowControl, inHighControl, outLowControl, outHighControl;
let controls = [];
let coachMarkIndex = 0;
let dragging = null;
let clampCheckbox;

const bgColor = "#343741";
const inRangeColor = '#8ca7f8';
const outRangeColor = '#76CBA6';
const inValueColor = '#875A86';
const outValueColor = '#CC0';

const codeLine1y = 25;
const codeLine2y = 60;
const inputRangeY = 160;
const outputRangeY = 350;

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

const ARDUINO_FRAMEWORK = 'Arduino';
const P5JS_FRAMEWORK = 'p5.js';
const frameworks = {
	'Arduino': {varDef: 'int'},
	'Processing': {varDef: 'float'},
	'p5.js': {varDef: 'let', hasClamp: true},
};
let frameworkName = P5JS_FRAMEWORK;

const referenceUrls = [
	['https://www.arduino.cc/reference/en/language/functions/math/map/', 'Arduino reference'],
	['https://processing.org/reference/map_.html', 'Processing reference'],
	['https://p5js.org/reference/#/p5/map', 'p5.js reference']
];

// Convert between program values and canvas X values.
// This doesn't use `scale` and `translate`, because we only want
// to transform the x positions, not the widths of text and shapes.
let xAdd = 0;
let xScale = 4;

const toCanvasX = x => xAdd + x * xScale;
const fromCanvasX = (xAdd) => (mouseX - xAdd) / xScale;

function setup() {
  createCanvas(windowWidth, 600);
  createSliders();

	createFrameworkSelector();

  clampCheckbox = createCheckbox('clamp', false);
  clampCheckbox.position(150, height - 55);
  clampCheckbox.style('color', 'white');
  clampCheckbox.attribute('title', 'Clamp the output between low and high');

	createPresets();
	createReferenceLinks();
}

function createFrameworkSelector() {
  createDiv('Framework').position(10, height - 80).style('color', 'white');
  let frameworkSel = createSelect().position(10, height - 55);
  Object.keys(frameworks).forEach(s => frameworkSel.option(s));
  frameworkSel.selected(P5JS_FRAMEWORK);
  frameworkSel.changed(() => {
    frameworkName = frameworkSel.value();
    let { hasClamp } = frameworks[frameworkName];
    if (hasClamp)
      clampCheckbox.show();
    else
      clampCheckbox.hide();
  });
}

function createSliders() {
  inputControl = new Controller(15, inputRangeY, inValueColor, "input");
  inLowControl = new Controller(10, inputRangeY, inRangeColor, "input low");
  inHighControl = new Controller(40, inputRangeY, inRangeColor, "input high");
  outLowControl = new Controller(100, outputRangeY, outRangeColor, "output low");
  outHighControl = new Controller(200, outputRangeY, outRangeColor, "output high");
}

function createReferenceLinks() {
  let y = height - 70;
  let maxWidth = max(referenceUrls.map(([_, title]) => textWidth(title)));
  for (let [href, title] of referenceUrls) {
    createA(href, title, 'map-reference').position(width - 40 - maxWidth, y).style('color', 'gray');
    y += 20;
  }
}

function createPresets() {
  let x = width - 300;
  let y = 20;
  createDiv('Presets').position(x, y).style('color', 'white');
  presets.forEach((preset, i) => {
    y += 20;
    if (i === floor(presets.length / 2)) {
      x += 150;
      y = 20;
    }
    let [s1, e1, s2, e2] = preset;
    let button = createButton(`${s1}, ${e1} → ${s2}, ${e2}`).position(x, y);
    button.mousePressed(() => {
      [inLowControl, inHighControl, outLowControl, outHighControl].forEach((slider, i) => slider.value = preset[i]);
      inputControl.value = constrain(inputControl.value, s1, e1);
    });
  });
}

function draw() {
  background(bgColor);

  let {varDef: declarator, hasClamp} = frameworks[frameworkName];
  let clamp = Boolean(hasClamp && clampCheckbox.checked());
  let maybeFloor = declarator === 'int' ? floor : (x) => x;

  const inLow = maybeFloor(inLowControl.value);
  const inHigh = maybeFloor(inHighControl.value);
  const outLow = maybeFloor(outLowControl.value);
  const outHigh = maybeFloor(outHighControl.value);
  const x = maybeFloor(inputControl.value);
  const y = maybeFloor(map(x, inLow, inHigh, outLow, outHigh, clamp));

  if (true) {
    const xs = [
      x, y,
      inLow, inHigh,
      outLow, outHigh
    ];
    const xMin = min(xs);
    const xMax = max(xs);
		const margin = 30;
		function interp(s0, t) {
			const s1 = lerp(s0, t, 0.1);
			return abs(s1 - s0) < 2 ? lerp(s0, t, 0.2) : s1;
		}
    if (toCanvasX(xMin) < margin || (!dragging && toCanvasX(xMin) > 2 * margin)) {
      xAdd = interp(xAdd, margin - xMin * xScale);
    }
    if (toCanvasX(xMax) > width - margin || (!dragging && toCanvasX(xMax) < width - 4 * margin)) {
      xScale = interp(xScale, (width - margin - xAdd) / xMax);
    }
  }

  push();
  translate(10, 0);
  strokeCap(SQUARE);

  textSize(30);
  textFont('Courier');
  fill('#ccc');
  const codeSpans = [
    `${declarator} output = map(`,
		`input, `,
    `${formatNumber(inLow)}, ${formatNumber(inHigh)}`,
    ', ',
    `${formatNumber(outLow)}, ${formatNumber(outHigh)}`,
    (clamp ? ", true" : "") + ');'
  ]
  const codeSpanWidths = codeSpans.map(s => textWidth(s));
	const inValueLeft = codeSpanWidths[0] + 10;
  const inTextLeft = inValueLeft + codeSpanWidths[1];
  const inTextRight = inTextLeft + codeSpanWidths[2];
  const outTextLeft = inTextRight + codeSpanWidths[3];
  const outTextRight = outTextLeft + codeSpanWidths[4];
  text(`${declarator} input = ${formatNumber(x)};`, 10, codeLine1y);
  text(codeSpans.join(''), 10, codeLine2y);
	fill(outValueColor);
	text("output",  10 + textWidth(`${declarator} `), codeLine2y);
  fill(inValueColor);
  text("input", 10 + textWidth(`${declarator} `), codeLine1y);
  text("input", inValueLeft, codeLine2y);
  fill(inRangeColor);
  text(codeSpans[2], inTextLeft, codeLine2y);
  fill(outRangeColor);
  text(codeSpans[4], outTextLeft, codeLine2y);

  textAlign(CENTER);

  // lines from inLow-outLow, inHigh-outHigh, input-output
  strokeWeight(4);
  stroke('#575A66');
  line(inLowControl.x, inLowControl.y, outLowControl.x, outLowControl.y);
  line(inHighControl.x, inHighControl.y, outHighControl.x, outHighControl.y);
  stroke('white');
  line(toCanvasX(x), inputRangeY, toCanvasX(y), outputRangeY);

  // input range lines and labels
  textSize(15);
  stroke(inRangeColor);
  fill(inRangeColor);
  strokeWeight(4);
  line(inTextLeft, codeLine2y + 10, inTextRight, codeLine2y + 10)
  strokeWeight(8);
  line(inLowControl.x, inLowControl.y, inHighControl.x, inHighControl.y);
  strokeWeight(0);
  text(formatNumber(inLow), inLowControl.x, inLowControl.y - 10);
  text(formatNumber(inHigh), inHighControl.x, inHighControl.y - 10);

  // line from 'x' to the dot on the input bar
  stroke(inValueColor);
  strokeWeight(2);
  line(inValueLeft + 8, codeLine2y + 10, toCanvasX(x), inputRangeY);

  // output range lines and labels
  stroke(outRangeColor);
  fill(outRangeColor);
  strokeWeight(4);
  line(outTextLeft, codeLine2y + 10, outTextRight, codeLine2y + 10)
  strokeWeight(8);
  strokeCap(SQUARE);
  line(outLowControl.x, outLowControl.y, outHighControl.x, outHighControl.y);
  strokeWeight(0);
  text(formatNumber(outLow), outLowControl.x, outLowControl.y - 10);
  text(formatNumber(outHigh), outHighControl.x, outHighControl.y - 10);

  // line from output value to label
	fill(outValueColor);
	stroke(outValueColor);
  strokeWeight(2);
  line(toCanvasX(y), outputRangeY, toCanvasX(y), 400);
  textSize(30);
  text(formatNumber(y), toCanvasX(y), 430);

	const coachSlider = controls.find(slider => slider.containsMouse()) || coachMarkIndex >= 0 && controls[coachMarkIndex];
  for (const slider of controls) {
    const [r, g, b] = slider.color.levels;
    const alpha = slider.containsMouse() || slider === dragging ? 255 : 100;
    fill(r, g, b, alpha);
    noStroke();
    circle(slider.x, slider.y, 20);
  }
	if (coachSlider && !dragging) {
		const slider = coachSlider;
		const label = `Drag this circle to change\nthe ${slider.label} value`;
		const c = '#fcc';
		textFont('Times');
		textSize(18);
		fill(c);
		const w = max(label.split('\n').map(s => textWidth(s)));
		const x = min(slider.x - 8, width - 20 - w);
		textAlign(LEFT);
		text(label, x, slider.y - 45);
		stroke(c);
		noFill();
    circle(slider.x, slider.y, 25);
		if (frameCount % 100 === 0) {
			coachMarkIndex = (coachMarkIndex + 1) % controls.length;
		}
	}

  pop();
}

const formatNumber = n => String(n).replace(/(\.\d{2})\d+/, '$1');

function mousePressed() {
  dragging = null;
	coachMarkIndex = -1;
  for (const slider of controls) {
    if (slider.containsMouse()) {
      dragging = slider;
      break;
    }
  }
}

function mouseDragged() {
  if (dragging) {
    dragging.value = fromCanvasX(xAdd);
  }
}

function mouseReleased() {
  dragging = null;
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
    return (this.x - mouseX + 10) ** 2 + (this.y - mouseY) ** 2 < 100;
  }
}
