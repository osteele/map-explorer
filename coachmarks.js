const coachMarkTextColor = "#dcc";

let coachMarkIndex = 0;
let prevCoachMarkControl = null;
let currentCoachMark = null;

const COACHMARK_ANIMATION_MS = 100;
let animationPrevPos = null;
let animationStartPos = null;
let animationStartTime = 0;

function drawCoachMarks() {
    const hovered = controls.find((control) => control.containsMouse());
    currentCoachMark = coachMarkIndex >= 0 ? controls[coachMarkIndex] : null;
    const control = hovered || currentCoachMark;
    if (hovered) { animationStartPos = animationPrevPos = null; }
    if (!control) return;

    push();
    textAlign(LEFT);
    textFont("Times");
    textSize(18);

    const label = `Drag this circle to change\nthe ${control.label} value`;
    const w = max(label.split("\n").map((s) => textWidth(s)));
    let x = control.x - OFFSET.x + 15;
    if (x + w > width - 20) {
        textAlign(RIGHT);
        x -= 10
    }

    fill(coachMarkTextColor);
    text(label, x, control.y - 58);

    noFill();
    {
        let { x, y } = control;
        if (animationStartPos) {
            const s = min((((frameCount - animationStartTime) / COACHMARK_ANIMATION_MS) * 5) ** 2, 1);
            x = lerp(animationStartPos.x, x, s);
            y = lerp(animationStartPos.y, y, s);
        }
        if (animationPrevPos) {
            const [r, g, b] = color(coachMarkTextColor).levels;
            const stepSize = 1 / max(abs(x - animationPrevPos.x), abs(y - animationPrevPos.y));
            for (let t = 0; t < 1; t += stepSize) {
                stroke(r, g, b, t * 255);
                circle(lerp(animationPrevPos.x, x, t), lerp(animationPrevPos.y, y, t), 25);
            }
        }
        stroke(coachMarkTextColor);
        circle(x, y, 25);
        animationPrevPos = { x, y };
    }

    const m = 2;
    fill(BG_COLOR);
    noStroke();
    rect(control.x - m, control.y - 70 - m, 2 * m, 60 + m);
    stroke(coachMarkTextColor);
    line(control.x, control.y - 70, control.x, control.y - 10)

    if (!hovered && frameCount % COACHMARK_ANIMATION_MS === 0) {
        animationStartTime = frameCount;
        animationStartPos = { x: control.x, y: control.y };
        // animationPrevPos = null;
        nextCoachMark();
    }
    pop();
}

function disableCouchMarks() {
    coachMarkIndex = -1;
    currentCoachMark = null;
}

function nextCoachMark() {
    coachMarkIndex = (coachMarkIndex + 1) % controls.length;
    currentCoachMark = coachMarkIndex >= 0 ? controls[coachMarkIndex] : null;
}
