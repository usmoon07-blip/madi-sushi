import { useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { useCart, toast } from '../store.jsx';
import { getLocation, haptic, openLink, openLocationSettings, requestPhone, tg } from '../telegram.js';
import { formatPhoneInput, isValidPhone, money, uid, yandexMapUrl, yandexSearchUrl } from '../format.js';
import Stepper from '../components/Stepper.jsx';
import { Segmented, Switch } from '../components/Controls.jsx';
import { CartIcon, CopyIcon, PinIcon, PhoneIcon, ArrowIcon } from '../components/Icons.jsx';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    el.remove();
  }
}

export default function Cart({ products, settings, user, onUserChange, onSuccess, onGoMenu, onReload }) {
  const cart = useCart();
  const [deliveryType, setDeliveryType] = useState('DELIVERY');
  const [paymentType, setPaymentType] = useState('CASH');
  const [phone, setPhone] = useState(user?.phone ? formatPhoneInput(user.phone) : '+998');
  const [address, setAddress] = useState(user?.lastAddress || '');
  const [coords, setCoords] = useState(
    user?.lastLat != null && user?.lastLon != null ? { lat: user.lastLat, lon: user.lastLon } : null
  );
  const [addressNote, setAddressNote] = useState('');
  const [comment, setComment] = useState('');
  const [locating, setLocating] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const clientRef = useRef(uid());
  const addressRef = useRef(null);
  const phoneRef = useRef(null);

  const upsell = useMemo(() => products.find((p) => /ichimlik/i.test(p.category)), [products]);
  const isDelivery = deliveryType === 'DELIVERY';
  const freeDelivery = settings.freeDeliveryFrom > 0 && cart.subtotal >= settings.freeDeliveryFrom;
  const deliveryFee = isDelivery && !freeDelivery ? settings.deliveryFee : 0;
  const total = cart.subtotal + deliveryFee;
  const cards = settings.cards || [];

  if (!cart.lines.length) {
    return (
      <div className="page page--center">
        <div className="empty-state">
          <div className="empty-state__icon">
            <CartIcon width={40} height={40} />
          </div>
          <h2>Savat bo'sh</h2>
          <p className="muted">Menyudan sevimli rollaringizni tanlang</p>
          <button type="button" className="btn btn--primary" onClick={onGoMenu}>
            Menyuga o'tish
          </button>
        </div>
      </div>
    );
  }

  const locate = async () => {
    haptic.tap();
    setLocating(true);
    try {
      const pos = await getLocation();
      setCoords(pos);
      setAddress('Manzil aniqlanmoqda...');
      try {
        const res = await api.geocode(pos.lat, pos.lon);
        setAddress(res.address);
      } catch {
        setAddress(`${pos.lat.toFixed(5)}, ${pos.lon.toFixed(5)}`);
      }
      haptic.success();
    } catch (err) {
      haptic.error();
      if (err.message === 'denied') {
        toast("Lokatsiyaga ruxsat berilmagan. Sozlamalardan ruxsat bering yoki manzilni qo'lda yozing", 'error');
        openLocationSettings();
      } else {
        toast("Lokatsiyani aniqlab bo'lmadi. Manzilni qo'lda yozing", 'error');
      }
      addressRef.current?.focus();
    } finally {
      setLocating(false);
    }
  };

  const shareTelegramPhone = async () => {
    setPhoneLoading(true);
    try {
      const res = await requestPhone();
      if (res.phone) {
        setPhone(formatPhoneInput(res.phone));
        return;
      }
      if (!res.ok) {
        if (!tg) toast('Raqamni qo‘lda kiriting');
        return;
      }
      // Raqam botga yuborildi — serverdan olamiz
      for (let i = 0; i < 4; i += 1) {
        await new Promise((r) => setTimeout(r, 900));
        const { user: fresh } = await api.me();
        if (fresh.phone) {
          setPhone(formatPhoneInput(fresh.phone));
          onUserChange(fresh);
          return;
        }
      }
    } catch {
      /* ignore */
    } finally {
      setPhoneLoading(false);
    }
  };

  const submit = async () => {
    if (submitting) return;
    if (!settings.isOpen) return toast('Hozir buyurtmalar qabul qilinmayapti', 'error');
    if (cart.subtotal < settings.minOrder) {
      return toast(`Minimal buyurtma: ${money(settings.minOrder)}`, 'error');
    }
    if (isDelivery && !address.trim() && !coords) {
      haptic.error();
      addressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return toast("Lokatsiyani yuboring yoki manzilni yozing", 'error');
    }
    if (!isValidPhone(phone)) {
      haptic.error();
      phoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return toast("Telefon raqamini to'liq kiriting", 'error');
    }

    setSubmitting(true);
    try {
      const { order } = await api.createOrder({
        clientRef: clientRef.current,
        items: cart.lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
        deliveryType,
        paymentType,
        phone,
        address: isDelivery ? address.trim() : null,
        addressNote: isDelivery ? addressNote.trim() : null,
        lat: isDelivery ? coords?.lat ?? null : null,
        lon: isDelivery ? coords?.lon ?? null : null,
        comment: comment.trim(),
      });
      haptic.success();
      cart.clear();
      clientRef.current = uid();
      onSuccess(order);
    } catch (err) {
      haptic.error();
      toast(err.message, 'error');
      if (err.status === 409) onReload();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--checkout">
      <h1 className="page__title">Savat</h1>

      <div className="panel">
        {cart.lines.map(({ product, qty }) => (
          <div key={product.id} className="line">
            <img className="line__img" src={product.imageUrl} alt="" />
            <div className="line__info">
              <div className="line__name">{product.name}</div>
              <div className="line__price">{money(product.price * qty)}</div>
            </div>
            <Stepper value={qty} onChange={(v) => cart.setQty(product.id, v)} size="sm" />
          </div>
        ))}
      </div>

      {upsell && (
        <div className="upsell">
          <img src={upsell.imageUrl} alt="" />
          <div className="upsell__text">
            Qo'shimcha ravishda <b>{upsell.name}</b> qo'shasizmi?
            <span className="upsell__price">+{money(upsell.price)}</span>
          </div>
          <Switch
            label={`${upsell.name} qo'shish`}
            checked={cart.qtyOf(upsell.id) > 0}
            onChange={(on) => {
              haptic.tap();
              cart.setQty(upsell.id, on ? 1 : 0);
            }}
          />
        </div>
      )}

      <h3 className="block-title">Qabul qilish usuli</h3>
      <Segmented
        value={deliveryType}
        onChange={(v) => {
          haptic.tap();
          setDeliveryType(v);
        }}
        options={[
          { value: 'DELIVERY', label: 'Yetkazib berish', icon: '🛵' },
          { value: 'PICKUP', label: 'Olib ketish', icon: '🏃' },
        ]}
      />

      {isDelivery ? (
        <div className="panel panel--form">
          <button type="button" className="btn btn--outline btn--block" onClick={locate} disabled={locating}>
            <PinIcon width={18} height={18} />
            {locating ? 'Aniqlanmoqda...' : coords ? 'Lokatsiyani qayta aniqlash' : 'Lokatsiyamni aniqlash'}
          </button>

          <label className="field">
            <span className="field__label">Manzil</span>
            <textarea
              ref={addressRef}
              rows={2}
              value={address}
              maxLength={300}
              placeholder="Tuman, ko'cha, uy raqami"
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          {coords && (
            <div className="geo-row">
              <span className="geo-row__dot" /> Lokatsiya biriktirildi
              <button type="button" className="link" onClick={() => openLink(yandexMapUrl(coords.lat, coords.lon))}>
                Xaritada ko'rish <ArrowIcon width={14} height={14} />
              </button>
              <button type="button" className="link link--muted" onClick={() => setCoords(null)}>
                Olib tashlash
              </button>
            </div>
          )}
          <label className="field">
            <span className="field__label">Xonadon, podyezd, qavat</span>
            <input value={addressNote} maxLength={200} placeholder="Masalan: 12-xonadon, 3-podyezd, 4-qavat" onChange={(e) => setAddressNote(e.target.value)} />
          </label>
        </div>
      ) : (
        <div className="panel pickup">
          <div className="pickup__icon">
            <PinIcon />
          </div>
          <div>
            <div className="pickup__label">Olib ketish manzili</div>
            <div className="pickup__addr">{settings.pickupAddress}</div>
            <button type="button" className="link" onClick={() => openLink(yandexSearchUrl(settings.pickupAddress))}>
              Yandex xaritada ochish <ArrowIcon width={14} height={14} />
            </button>
          </div>
        </div>
      )}

      <h3 className="block-title">Telefon raqam</h3>
      <div className="panel panel--form">
        <div className="phone-row">
          <input
            ref={phoneRef}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            placeholder="+998 90 123 45 67"
          />
          {tg && (
            <button type="button" className="btn btn--outline btn--icon" onClick={shareTelegramPhone} disabled={phoneLoading} aria-label="Telegram raqamini yuborish">
              <PhoneIcon width={18} height={18} />
            </button>
          )}
        </div>
        {tg && !isValidPhone(phone) && (
          <button type="button" className="link" onClick={shareTelegramPhone} disabled={phoneLoading}>
            {phoneLoading ? 'Kutilmoqda...' : 'Telegram raqamimni yuborish'}
          </button>
        )}
      </div>

      <h3 className="block-title">To'lov usuli</h3>
      <Segmented
        value={paymentType}
        onChange={(v) => {
          haptic.tap();
          setPaymentType(v);
        }}
        options={[
          { value: 'CASH', label: 'Naqd', icon: '💵' },
          { value: 'CARD', label: 'Karta', icon: '💳' },
        ]}
      />
      {paymentType === 'CARD' && (
        <div className="panel">
          {cards.length ? (
            <>
              <p className="muted small">Quyidagi kartaga o'tkazing va chekni {isDelivery ? 'kuryerga' : 'kassada'} ko'rsating:</p>
              {cards.map((c) => (
                <div key={c.number} className="bank-card">
                  <div>
                    <div className="bank-card__bank">{c.bank || 'Karta'}</div>
                    <div className="bank-card__number">{c.number}</div>
                    {c.holder && <div className="bank-card__holder">{c.holder}</div>}
                  </div>
                  <button
                    type="button"
                    className="btn btn--outline btn--icon"
                    aria-label="Nusxalash"
                    onClick={async () => {
                      await copyText(c.number.replace(/\s/g, ''));
                      haptic.success();
                      toast('Karta raqami nusxalandi', 'success');
                    }}
                  >
                    <CopyIcon width={18} height={18} />
                  </button>
                </div>
              ))}
            </>
          ) : (
            <p className="muted small">Karta ma'lumotlari {isDelivery ? 'kuryer' : 'kassir'} tomonidan beriladi.</p>
          )}
        </div>
      )}

      <h3 className="block-title">Izoh</h3>
      <div className="panel panel--form">
        <input value={comment} maxLength={300} placeholder="Masalan: qo'ng'iroq qilmang, eshik oldida qoldiring" onChange={(e) => setComment(e.target.value)} />
      </div>

      <div className="panel summary">
        <div className="summary__row">
          <span>Mahsulotlar</span>
          <span>{money(cart.subtotal)}</span>
        </div>
        {isDelivery && (
          <div className="summary__row">
            <span>Yetkazib berish</span>
            <span className={freeDelivery ? 'text-green' : ''}>{freeDelivery ? 'Bepul' : money(settings.deliveryFee)}</span>
          </div>
        )}
        {isDelivery && !freeDelivery && settings.freeDeliveryFrom > 0 && (
          <div className="summary__hint">Yana {money(settings.freeDeliveryFrom - cart.subtotal)} — yetkazib berish bepul</div>
        )}
        <div className="summary__row summary__row--total">
          <span>Jami</span>
          <span>{money(total)}</span>
        </div>
        {cart.subtotal < settings.minOrder && (
          <div className="summary__hint summary__hint--red">Minimal buyurtma summasi: {money(settings.minOrder)}</div>
        )}
      </div>

      <div className="checkout-bar">
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={submit} disabled={submitting}>
          {submitting ? 'Yuborilmoqda...' : (
            <>
              <span>Buyurtmani tasdiqlash</span>
              <span className="btn__sum">{money(total)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
