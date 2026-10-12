// Yangi buyurtma uchun qisqa ovozli signal (fayl kerak emas)
let ctx;
export function beep() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    [0, 0.18, 0.36].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 2 ? 1175 : 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.17);
    });
  } catch {
    /* ovoz o'chirilgan */
  }
}
