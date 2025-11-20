const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let y = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // falling twinkly rose
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(200, y, 20, 0, Math.PI * 2);
    ctx.fill();

    y += 2;
    if (y > canvas.height) y = 0;

    requestAnimationFrame(draw);
}

draw();
