export function drawCar(ctx, car) {
  ctx.save();
  ctx.translate(car.x, car.y - 18);
  ctx.rotate(car.angle);

  ctx.fillStyle = '#cc2b2b';
  ctx.fillRect(-64, -28, 128, 32);

  drawWheel(ctx, -44, 12, car.wheelSpin);
  drawWheel(ctx, 44, 12, car.wheelSpin);
  ctx.restore();
}

function drawWheel(ctx, x, y, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = '#1f1f1f';
  ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#bbb';
  ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke();
  ctx.restore();
}
