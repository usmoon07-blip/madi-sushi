import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';
import { formatDate, money } from '../format.js';

// Mijoz yuborgan karta to'lovi cheki
export default function ReceiptModal({ order, onClose }) {
  const [url, setUrl] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState('');

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
      </div>
    </Modal>
  );
}
