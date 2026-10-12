import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Modal from './Modal.jsx';

// Kompyuterda: telefon bilan skanerlash uchun QR-kod
export default function YandexGoModal({ order, url, note, onClose }) {
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 280, margin: 1, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr(''));
  }, [url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal title={`🚕 Yandex Go — buyurtma #${order.id}`} onClose={onClose}>
      <div className="ygo">
        <div className="ygo__qr">{qr ? <img src={qr} alt="Yandex Go QR" /> : '...'}</div>
        <div className="ygo__info">
          <ol>
            <li>Telefon kamerasi bilan QR-kodni skanerlang</li>
            <li>Yandex Go «Dostavka» bo'limida ochiladi</li>
            <li>
              <b>Qayerga</b> maydonida mijoz lokatsiyasi turadi
            </li>
          </ol>
          <div className="ygo__coords">
            📍 {Number(order.lat).toFixed(6)}, {Number(order.lon).toFixed(6)}
          </div>
          <div className="ygo__actions">
            <a className="btn btn--ygo" href={url} target="_blank" rel="noreferrer">
              Shu kompyuterda ochish
            </a>
            <button type="button" className="btn btn--ghost" onClick={copy}>
              {copied ? '✓ Nusxalandi' : '📋 Kuryerga izohni nusxalash'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
