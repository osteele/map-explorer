let inputSlider, inLow, inHigh, outLow, outHigh;
let sliders = [];
let coachMarkIndex = 0;
let dragging = null;
let clampCheckbox;

const inRangeColor = '#8ca7f8';
const outRangeColor = '#76CBA6';
const inValueColor = '#875A86';
const outValueColor = '#CC0';

const textY = 60;
const line1y = 160;
const line2y = 350;

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

const referenceUrls = [
	['https://www.arduino.cc/reference/en/language/functions/math/map/', 'Arduino reference'],
	['https://processing.org/reference/map_.html', 'Processing reference'],
	['https://p5js.org/reference/#/p5/map', 'p5.js reference']
];

let frameworkName = P5JS_FRAMEWORK;
let xAdd = 0;
let xScale = 4;

if (window.location.hash === '#arduino') {
	framework = ARDUINO_FRAMEWORK;
}

function setup() {
  createCanvas(windowWidth, 600);
  inputSlider = new Slider(15, line1y, inValueColor, "input");
  inLow = new Slider(10, line1y, inRangeColor, "input low");
  inHigh = new Slider(40, line1y, inRangeColor, "input high");
  outLow = new Slider(100, line2y, outRangeColor, "output low");
  outHigh = new Slider(200, line2y, outRangeColor, "output high");

	createDiv('Framework').position(10, height - 80).style('color', 'white');
  let frameworkSel = createSelect().position(10, height - 55);
	Object.keys(frameworks).forEach(s => frameworkSel.option(s));
  frameworkSel.selected(P5JS_FRAMEWORK);
  frameworkSel.changed(() => {
	  frameworkName = frameworkSel.value();
		let {hasClamp} = frameworks[frameworkName];
    if (hasClamp) clampCheckbox.show();
    else clampCheckbox.hide();
  });

  clampCheckbox = createCheckbox('clamp', false);
  clampCheckbox.position(150, height - 55)
  clampCheckbox.style('color', 'white');

	{
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
				[inLow, inHigh, outLow, outHigh].forEach((slider, i) => slider.value = preset[i]);
				inputSlider.value = constrain(inputSlider.value, s1, e1);
			});
		});
	}
	{
		let y = height - 70;
		let maxWidth = max(referenceUrls.map(([_, title]) => textWidth(title)));
		for (let [href, title] of referenceUrls) {
			createA(href, title, 'map-reference').position(width - 40 - maxWidth, y).style('color', 'gray');
			y += 20;
		}
	}
}

function draw() {
  background('#343741');

  let {varDef: declarator, hasClamp} = frameworks[frameworkName];
  let clamp = hasClamp && clampCheckbox.checked() || false;
	let maybeFloor = declarator === 'int' ? floor : (x) => x;
  let x = maybeFloor(inputSlider.value);
  let y = maybeFloor(map(x, inLow.value, inHigh.value, outLow.value, outHigh.value, clamp));

  if (true) {
    let xs = [
      x, y,
      inLow.value, inHigh.value,
      outLow.value, outHigh.value
    ];
    let xMin = min(xs);
    let xMax = max(xs);
		const margin = 30;
		function interp(s0, t) {
			let s1 = lerp(s0, t, 0.1);
			return abs(s1 - s0) < 2 ? lerp(s0, t, 0.2) : s1;
		}
    if (xAdd + xMin * xScale < margin || (!dragging && xAdd + xMin * xScale > 2 * margin)) {
      xAdd = interp(xAdd, margin - xMin * xScale);
    }
    if (xAdd + xMax * xScale > width - margin || (!dragging && xAdd + xMax * xScale < width - 4 * margin)) {
      xScale = interp(xScale, (width - margin - xAdd) / xMax);
    }
  }

  push();
  translate(10, 0);
  strokeCap(SQUARE);

  textSize(30);
  textFont('Courier');
  fill('#ccc');
  let codeSpans = [
    `${declarator} output = map(`,
		`input, `,
    `${formatNumber(inLow.value)}, ${formatNumber(inHigh.value)}`,
    ', ',
    `${formatNumber(outLow.value)}, ${formatNumber(outHigh.value)}`,
    (clamp ? ", true" : "") + ');'
  ]
  let codeSpanWidths = codeSpans.map(s => textWidth(s));
	let inValueLeft = codeSpanWidths[0] + 10;
  let inTextLeft = inValueLeft + codeSpanWidths[1];
  let inTextRight = inTextLeft + codeSpanWidths[2];
  let outTextLeft = inTextRight + codeSpanWidths[3];
  let outTextRight = outTextLeft + codeSpanWidths[4];
	const textLine1y = 25;
  text(`${declarator} input = ${formatNumber(x)};`, 10, textLine1y);
  text(codeSpans.join(''), 10, textY);
	fill(outValueColor);
	text("output",  10 + textWidth(`${declarator} `), textY);
  fill(inValueColor);
  text("input", 10 + textWidth(`${declarator} `), textLine1y);
  text("input", inValueLeft, textY);
  fill(inRangeColor);
  text(codeSpans[2], inTextLeft, textY);
  fill(outRangeColor);
  text(codeSpans[4], outTextLeft, textY);

  textAlign(CENTER);

  // lines from inLow-outLow, inHigh-outHigh, input-output
  strokeWeight(4);
  stroke('#575A66');
  line(inLow.x, inLow.y, outLow.x, outLow.y);
  line(inHigh.x, inHigh.y, outHigh.x, outHigh.y);
  stroke('white');
  line(xAdd + x * xScale, line1y, xAdd + y * xScale, line2y);

  // input range lines and labels
  textSize(15);
  stroke(inRangeColor);
  fill(inRangeColor);
  strokeWeight(4);
  line(inTextLeft, textY + 10, inTextRight, textY + 10)
  strokeWeight(8);
  line(inLow.x, inLow.y, inHigh.x, inHigh.y);
  strokeWeight(0);
  text(formatNumber(inLow.value), inLow.x, inLow.y - 10);
  text(formatNumber(inHigh.value), inHigh.x, inHigh.y - 10);

  // line from 'x' to the dot on the input bar
  stroke(inValueColor);
  strokeWeight(2);
  line(inValueLeft + 8, textY + 10, xAdd + x * xScale, line1y);

  // output range lines and labels
  stroke(outRangeColor);
  fill(outRangeColor);
  strokeWeight(4);
  line(outTextLeft, textY + 10, outTextRight, textY + 10)
  strokeWeight(8);
  strokeCap(SQUARE);
  line(outLow.x, outLow.y, outHigh.x, outHigh.y);
  strokeWeight(0);
  text(formatNumber(outLow.value), outLow.x, outLow.y - 10);
  text(formatNumber(outHigh.value), outHigh.x, outHigh.y - 10);

  // line from output value to label
	fill(outValueColor);
	stroke(outValueColor);
  strokeWeight(2);
  line(xAdd + y * xScale, line2y, xAdd + y * xScale, 400);
  textSize(30);
  text(formatNumber(y), xAdd + y * xScale, 430);

	let coachSlider = sliders.find(slider => slider.containsMouse()) || coachMarkIndex >= 0 && sliders[coachMarkIndex];
  for (let slider of sliders) {
    let [r, g, b] = slider.color.levels;
    let alpha = slider.containsMouse() || slider === dragging ? 255 : 100;
    fill(r, g, b, alpha);
    noStroke();
    circle(slider.x, slider.y, 20);
  }
	if (coachSlider && !dragging) {
		let slider = coachSlider;
		let label = `Drag this circle to change\nthe ${slider.label} value`;
		const c = '#fcc';
		textFont('Times');
		textSize(18);
		fill(c);
		let w = max(label.split('\n').map(s => textWidth(s)));
		let x = min(slider.x - 8, width - 20 - w);
		textAlign(LEFT);
		text(label, x, slider.y - 45);
		stroke(c);
		noFill();
    circle(slider.x, slider.y, 25);
		if (frameCount % 100 === 0) {
			coachMarkIndex = (coachMarkIndex + 1) % sliders.length;
		}
	}

  pop();
}

const formatNumber = n => String(n).replace(/(\.\d{2})\d+/, '$1');

function mousePressed() {
  dragging = null;
	coachMarkIndex = -1;
  for (let slider of sliders) {
    if (slider.containsMouse()) {
      dragging = slider;
      break;
    }
  }
}

function mouseDragged() {
  if (dragging) {
    dragging.value = (mouseX - xAdd) / xScale;
  }
}

function mouseReleased() {
  dragging = null;
}

class Slider {
  constructor(value, y, c, label) {
    this.v = value;
    this.y = y;
    this.color = color(c);
		this.label = label;
    sliders.push(this);
  }

	get value() {
		let v = this.v;
		if (frameworkName === ARDUINO_FRAMEWORK) {
			v = floor(v);
		}
		return v;
	}

	set value (v) {
		this.v = v;
	}

  get x() {
    return xAdd + this.value * xScale;
  }

  containsMouse() {
    return (this.x - mouseX + 10) ** 2 + (this.y - mouseY) ** 2 < 100;
  }
}
