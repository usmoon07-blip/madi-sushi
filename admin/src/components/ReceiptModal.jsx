import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';
import { formatDate, money } from '../format.js';

// Mijoz yuborgan karta to'lovi cheki
export default function ReceiptModal({ order, onClose, onChanged }) {
  const [url, setUrl] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const decide = async (ok) => {
    if (!ok && !window.confirm("Chekni rad etasizmi? Mijozdan chekni qayta jo'natish so'raladi.")) return;
    setBusy(true);
    try {
      await (ok ? api.confirmReceipt(order.id) : api.rejectReceipt(order.id));
      onChanged?.();
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  useEffect(() => {
    let objectUrl = '';
    api
      .receipt(order.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setType(blob.type);
        setUrl(objectUrl);
      })
      .catch((e) => setError(e.message));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [order.id]);

  return (
    <Modal title={`🧾 Chek — buyurtma #${order.id}`} onClose={onClose}>
      <div className="receipt-view">
        <p className="muted">
          {order.customerName} · {money(order.total)} · {formatDate(order.receiptAt)}
        </p>
        {error && <div className="error">{error}</div>}
        {!url && !error && <p className="muted">Yuklanmoqda...</p>}
        {url && type === 'application/pdf' && (
          <a className="btn btn--primary" href={url} target="_blank" rel="noreferrer">
            PDF chekni ochish
          </a>
        )}
        {url && type !== 'application/pdf' && <img src={url} alt="Chek" />}
        {order.receiptConfirmedAt ? (
          <div className="receipt-ok">✅ To'lov tasdiqlangan · {formatDate(order.receiptConfirmedAt)}</div>
        ) : (
          <div className="receipt-actions">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={() => decide(true)}>
              ✅ To'lovni tasdiqlash
            </button>
            <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => decide(false)}>
              ❌ Rad etish
            </button>
          </div>
        )}
        {!order.receiptConfirmedAt && <p className="muted small">Tasdiqlansa, mijozga «To'lov tasdiqlandi» xabari boradi va buyurtma «Tayyorlanmoqda»ga o'tadi.</p>}
      </div>
    </Modal>
  );
}
