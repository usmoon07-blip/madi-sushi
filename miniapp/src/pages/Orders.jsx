import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useCart, toast } from '../store.jsx';
import { useApp } from '../appState.jsx';
import { useT } from '../i18n.jsx';
import { haptic } from '../telegram.js';
import { formatDate } from '../format.js';
import { RepeatIcon } from '../components/Icons.jsx';

const TONE = { NEW: 'red', ACCEPTED: 'amber', ON_WAY: 'blue', DONE: 'green', CANCELLED: 'gray' };

export default function Orders() {
  const { t, lang, money } = useT();
  const cart = useCart();
  const app = useApp();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api
      .orders()
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);

  // Sahifa ochiq turganda holatlar har 15 soniyada jimgina yangilanadi
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden) return;
      api
        .orders()
        .then((d) => {
          setOrders(d.orders);
          setError('');
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const reorder = (order) => {
    const available = new Set(app.products.map((p) => p.id));
    let added = 0;
    let missing = 0;
    for (const item of order.items) {
      if (available.has(item.productId)) {
        cart.setQty(item.productId, item.qty);
        added += 1;
      } else missing += 1;
    }
    if (!added) return toast(t('unavailableAll'), 'error');
    haptic.success();
    if (missing) toast(t('unavailableSome', missing));
    app.goTab('cart');
  };

  const itemName = (i) => (lang === 'ru' && i.nameRu ? i.nameRu : i.name);

  return (
    <div className="page">
      <h1 className="page__title">{t('myOrders')}</h1>
      {error && (
        <div className="panel">
          <p className="muted">{error}</p>
          <button type="button" className="btn btn--outline" onClick={load}>
            {t('retry')}
          </button>
        </div>
      )}
      {!orders && !error && <div className="skeleton" />}
      {orders && !orders.length && <div className="panel muted">{t('noOrders')}</div>}
      {orders?.map((o) => (
        <div key={o.id} className="panel order">
          <div className="row-between">
            <div>
              <div className="order__id">
                {t('order')} #{o.id}
              </div>
              <div className="muted small">{formatDate(o.createdAt)}</div>
            </div>
            <span className={`pill pill--${TONE[o.status]}`}>{t('status')[o.status]}</span>
          </div>
          <div className="order__items">
            {o.items.map((i) => (
              <div key={i.productId} className="order__item">
                <span>
                  {itemName(i)} × {i.qty}
                </span>
                <span>{money(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="row-between order__foot">
            <span className="muted small">
              {o.deliveryType === 'DELIVERY' ? `🛵 ${t('delivery')}` : `🏃 ${t('pickup')}`} · {o.paymentType === 'CARD' ? `💳 ${t('card')}` : `💵 ${t('cash')}`}
            </span>
            <b>{money(o.total)}</b>
          </div>
          {o.paymentType === 'CARD' && o.status !== 'CANCELLED' && (
            <div className={`pay-state ${o.receiptConfirmedAt ? 'is-ok' : o.receiptAt ? 'is-check' : 'is-wait'}`}>
              {o.receiptConfirmedAt ? t('payConfirmed') : o.receiptAt ? t('payChecking') : t('payWaiting')}
            </div>
          )}
          <button type="button" className="btn btn--outline btn--block" onClick={() => reorder(o)}>
            <RepeatIcon width={18} height={18} /> {t('reorder')}
          </button>
        </div>
      ))}
    </div>
  );
}
