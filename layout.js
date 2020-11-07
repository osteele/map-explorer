// Layout
const OFFSET = { x: 10, y: 100 }; // from top left of canvas
let layout;

function calculateLayout() {
    const shortWindow = window.innerHeight < 750;

    const codeline1y = 40;
    const codeline2y = 82;
    const inputRangeY = shortWindow ? 170 : 200;
    const outputRangeY = shortWindow ? 280 : 420;
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
