const coachMarkTextColor = "#dcc";

let coachMarkIndex = 0;
let prevCoachMarkControl = null;
let currentCoachMark = null;

function drawCoachMarks() {
    const hovered = controls.find((control) => control.containsMouse());
    const control = hovered || (coachMarkIndex >= 0 && controls[coachMarkIndex]);
    if (hovered) { prevCoachMarkControl = null; }
    if (!control) return;

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
    stroke(coachMarkTextColor);
    {
        let { x, y } = control;
        if (prevCoachMarkControl) {
            const s = min(((frameCount % 100) / 10) ** 2, 1);
            x = lerp(prevCoachMarkControl.x, x, s);
            y = lerp(prevCoachMarkControl.y, y, s);
        }
        circle(x, y, 25);
    }

    line(control.x, control.y - 70, control.x, control.y - 10)

    if (!hovered && frameCount % 100 === 0) {
        prevCoachMarkControl = control;
        nextCoachMark();
    }
}

function disableCouchMarks() {
    coachMarkIndex = -1;
    currentCoachMark = null;
}

function nextCoachMark() {
    coachMarkIndex = (coachMarkIndex + 1) % controls.length;
    currentCoachMark = coachMarkIndex >= 0 ? controls[coachMarkIndex] : null;
}
