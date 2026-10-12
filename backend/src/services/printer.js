// Tarmoq (LAN/Wi-Fi) termoprinterga ESC/POS buyruqlarini to'g'ridan-to'g'ri yuborish (9100-port)
const net = require('net');

const ESC = 0x1b;
const GS = 0x1d;
const CMD = {
  init: [ESC, 0x40],
  alignLeft: [ESC, 0x61, 0],
  alignCenter: [ESC, 0x61, 1],
  boldOn: [ESC, 0x45, 1],
  boldOff: [ESC, 0x45, 0],
  sizeNormal: [GS, 0x21, 0x00],
  sizeBig: [GS, 0x21, 0x11],
  feedAndCut: [ESC, 0x64, 4, GS, 0x56, 0x42, 0x00],
};

const columnsFor = (paperWidth) => (Number(paperWidth) === 58 ? 32 : 48);

function parseAddress(address) {
  const [host, port] = String(address).trim().split(':');
  return { host, port: Number(port) || 9100 };
}

function encode(lines, copies = 1) {
  const parts = [];
  const push = (arr) => parts.push(Buffer.from(arr));
  for (let c = 0; c < copies; c += 1) {
    push(CMD.init);
    for (const line of lines) {
      push(line.align === 'center' ? CMD.alignCenter : CMD.alignLeft);
      push(line.bold ? CMD.boldOn : CMD.boldOff);
      push(line.big ? CMD.sizeBig : CMD.sizeNormal);
      parts.push(Buffer.from(`${line.text}\n`, 'ascii'));
    }
    push(CMD.sizeNormal);
    push(CMD.boldOff);
    push(CMD.feedAndCut);
  }
  return Buffer.concat(parts);
}

function send(address, data, timeoutMs = 6000) {
  const { host, port } = parseAddress(address);
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    const fail = (err) => {
      socket.destroy();
      reject(err);
    };
    socket.setTimeout(timeoutMs, () => fail(new Error(`Printer javob bermadi (${host}:${port})`)));
    socket.once('error', (err) => fail(new Error(`Printerga ulanib bo'lmadi (${host}:${port}): ${err.code || err.message}`)));
    socket.once('connect', () => socket.end(data));
    socket.once('close', (hadError) => !hadError && resolve());
  });
}

const printLines = (address, lines, copies) => send(address, encode(lines, copies));

module.exports = { printLines, columnsFor, parseAddress };
