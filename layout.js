// Layout
const MIN_WINDOW_HEIGHT = 390;
const OFFSET = { x: 10, y: 100 }; // from top left of canvas

let layout;

function calculateLayout() {
    const shortWindow = height < 450;

    const codeline1y = 40;
    const codeline2y = 82;
    const inputRangeY = shortWindow ? 170 : 200;
    const outputRangeY = shortWindow ? height - 180 : height - 200;
    const outputLabelY = shortWindow ? outputRangeY - 40 : outputRangeY + 80;
    const outputLabelLineY = shortWindow ? outputLabelY + 1 : outputLabelY - 30;

    layout = {
        codeline1y,
        codeline2y,
        inputRangeY,
        outputRangeY,
        outputLabelY,
        outputLabelLineY,
    }
}
