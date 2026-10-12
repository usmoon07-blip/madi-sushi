import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useCart, toast } from '../store.jsx';
import { haptic, openLink } from '../telegram.js';
import { STATUS, formatDate, formatPhoneInput, isValidPhone, money, yandexSearchUrl } from '../format.js';
import { RepeatIcon, PinIcon, PhoneIcon, ArrowIcon } from '../components/Icons.jsx';

export default function Profile({ user, settings, products, onUserChange, onGoCart }) {
  const cart = useCart();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(user?.phone ? formatPhoneInput(user.phone) : '+998');

  const load = () => {
    setError('');
    api
      .orders()
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const savePhone = async () => {
    if (!isValidPhone(phone)) return toast("Telefon raqamini to'liq kiriting", 'error');
    try {
      const { user: fresh } = await api.savePhone(phone);
      onUserChange(fresh);
      setEditing(false);
      toast('Saqlandi', 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const reorder = (order) => {
    const available = new Set(products.map((p) => p.id));
    let added = 0;
    let missing = 0;
    for (const item of order.items) {
      if (available.has(item.productId)) {
        cart.setQty(item.productId, item.qty);
        added += 1;
      } else missing += 1;
    }
    if (!added) return toast("Bu buyurtmadagi mahsulotlar hozir mavjud emas", 'error');
    haptic.success();
    if (missing) toast(`${missing} ta mahsulot hozir mavjud emas`, 'default');
    onGoCart();
  };

  const initials = (user?.firstName || '?').slice(0, 1).toUpperCase();

  return (
    <div className="page">
      <h1 className="page__title">Profil</h1>

      <div className="panel profile">
        <div className="avatar">{initials}</div>
        <div className="profile__info">
          <div className="profile__name">{[user?.firstName, user?.lastName].filter(Boolean).join(' ')}</div>
          {user?.username && <div className="muted small">@{user.username}</div>}
        </div>
      </div>

      <div className="panel panel--form">
        <div className="row-between">
          <span className="field__label">Telefon raqam</span>
          {!editing && (
            <button type="button" className="link" onClick={() => setEditing(true)}>
              {user?.phone ? "O'zgartirish" : "Qo'shish"}
            </button>
          )}
        </div>
        {editing ? (
          <div className="phone-row">
            <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} />
            <button type="button" className="btn btn--primary" onClick={savePhone}>
              Saqlash
            </button>
          </div>
        ) : (
          <div className="profile__phone">{user?.phone || 'Kiritilmagan'}</div>
        )}
      </div>

      <h3 className="block-title">📜 Mening buyurtmalarim</h3>
      {error && (
        <div className="panel">
          <p className="muted">{error}</p>
          <button type="button" className="btn btn--outline" onClick={load}>
            Qayta urinish
          </button>
        </div>
      )}
      {!orders && !error && <div className="skeleton" />}
      {orders && !orders.length && <div className="panel muted">Hali buyurtmalar yo'q. Birinchi buyurtmangizni bering! 🍣</div>}
      {orders?.map((o) => (
        <div key={o.id} className="panel order">
          <div className="row-between">
            <div>
              <div className="order__id">Buyurtma #{o.id}</div>
              <div className="muted small">{formatDate(o.createdAt)}</div>
            </div>
            <span className={`pill pill--${STATUS[o.status]?.tone}`}>{STATUS[o.status]?.label}</span>
          </div>
          <div className="order__items">
            {o.items.map((i) => (
              <div key={i.productId} className="order__item">
                <span>
                  {i.name} × {i.qty}
                </span>
                <span>{money(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="row-between order__foot">
            <span className="muted small">
              {o.deliveryType === 'DELIVERY' ? '🛵 Yetkazib berish' : '🏃 Olib ketish'} · {o.paymentType === 'CARD' ? '💳 Karta' : '💵 Naqd'}
            </span>
            <b>{money(o.total)}</b>
          </div>
          <button type="button" className="btn btn--outline btn--block" onClick={() => reorder(o)}>
            <RepeatIcon width={18} height={18} /> Yana shundan buyurtma qilish
          </button>
        </div>
      ))}

      <h3 className="block-title">Biz haqimizda</h3>
      <div className="panel contact">
        <button type="button" className="contact__row" onClick={() => openLink(yandexSearchUrl(settings.pickupAddress))}>
          <PinIcon width={18} height={18} />
          <span>{settings.pickupAddress}</span>
          <ArrowIcon width={14} height={14} />
        </button>
        {settings.contactPhone && (
          <a className="contact__row" href={`tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`}>
            <PhoneIcon width={18} height={18} />
            <span>{settings.contactPhone}</span>
          </a>
        )}
      </div>
    </div>
  );
}
