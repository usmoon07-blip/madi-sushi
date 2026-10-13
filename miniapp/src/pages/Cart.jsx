import { useEffect, useMemo, useRef, useState } from 'react';
import SafeImg from '../components/SafeImg.jsx';
import { api } from '../api.js';
import { useCart, toast } from '../store.jsx';
import { addressDetails, useApp } from '../appState.jsx';
import { useT } from '../i18n.jsx';
import { haptic, openLink, requestPhone, tg } from '../telegram.js';
import { formatPhoneInput, isValidPhone, uid, yandexMapUrl, yandexSearchUrl } from '../format.js';
import Stepper from '../components/Stepper.jsx';
import { Segmented, Switch } from '../components/Controls.jsx';
import { ArrowIcon, CartIcon, CopyIcon, PhoneIcon, PinIcon } from '../components/Icons.jsx';
import { branchMapUrl } from '../components/BranchSheet.jsx';

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

export default function Cart({ onSuccess }) {
  const cart = useCart();
  const app = useApp();
  const { t, pick, money } = useT();
  const { settings, user, mode, location } = app;
  const [paymentType, setPaymentType] = useState('CASH');
  const [phone, setPhone] = useState(user?.phone ? formatPhoneInput(user.phone) : '+998');
  const [addressNote, setAddressNote] = useState('');
  const [comment, setComment] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const clientRef = useRef(uid());
  const addressRef = useRef(null);
  const phoneRef = useRef(null);

  // Server keyinroq javob bersa (menyu nusxadan ochilgan), saqlangan raqamni to'ldiramiz
  useEffect(() => {
    if (user?.phone) setPhone((p) => (isValidPhone(p) ? p : formatPhoneInput(user.phone)));
  }, [user]);

  const upsell = useMemo(() => {
    const drinks = app.categories.find((c) => /ichimlik/i.test(c.nameUz));
    return drinks ? app.products.find((p) => p.categoryId === drinks.id) : null;
  }, [app.products, app.categories]);

  const isDelivery = mode === 'DELIVERY';
  const total = cart.subtotal;
  const cards = settings.cards || [];
  const hasCoords = location?.lat != null && location?.lon != null;

  if (!cart.lines.length) {
    return (
      <div className="page page--center">
        <div className="empty-state">
          <div className="empty-state__icon">
            <CartIcon width={40} height={40} />
          </div>
          <h2>{t('cartEmpty')}</h2>
          <p className="muted">{t('cartEmptyText')}</p>
          <button type="button" className="btn btn--primary" onClick={() => app.openMenu()}>
            {t('toMenu')}
          </button>
        </div>
      </div>
    );
  }

  const shareTelegramPhone = async () => {
    setPhoneLoading(true);
    try {
      const res = await requestPhone();
      if (res.phone) {
        setPhone(formatPhoneInput(res.phone));
        return;
      }
      if (!res.ok) {
        if (!tg) toast(t('errPhoneManual'));
        return;
      }
      // Raqam botga yuborildi — serverdan olamiz
      for (let i = 0; i < 4; i += 1) {
        await new Promise((r) => setTimeout(r, 900));
        const { user: fresh } = await api.me();
        if (fresh.phone) {
          setPhone(formatPhoneInput(fresh.phone));
          app.setUser(fresh);
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
    if (!settings.isOpen) return toast(t('errClosed'), 'error');
    if (cart.subtotal < settings.minOrder) return toast(t('minOrder', money(settings.minOrder)), 'error');
    if (isDelivery && !location?.address && !hasCoords) {
      haptic.error();
      app.openAddress();
      return toast(t('errAddress'), 'error');
    }
    if (!isValidPhone(phone)) {
      haptic.error();
      phoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return toast(t('errPhone'), 'error');
    }

    setSubmitting(true);
    try {
      const { order } = await api.createOrder({
        clientRef: clientRef.current,
        items: cart.lines.map((l) => ({ productId: l.product.id, qty: l.qty, name: l.product.name })),
        deliveryType: mode,
        paymentType,
        phone,
        address: isDelivery ? location?.address || null : null,
        branchId: isDelivery ? null : app.branch?.id ?? null,
        addressNote: isDelivery ? [addressDetails(location), addressNote.trim()].filter(Boolean).join(' · ') : null,
        lat: isDelivery && hasCoords ? location.lat : null,
        lon: isDelivery && hasCoords ? location.lon : null,
        comment: comment.trim(),
      });
      haptic.success();
      cart.clear();
      clientRef.current = uid();
      onSuccess(order);
    } catch (err) {
      haptic.error();
      toast(err.message, 'error');
      if (err.status === 409) app.reload();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--checkout">
      <h1 className="page__title">{t('cart')}</h1>

      <div className="panel">
        {cart.lines.map(({ product, qty }) => (
          <div key={product.id} className="line">
            <SafeImg className="line__img" src={product.imageUrl} />
            <div className="line__info">
              <div className="line__name">{pick(product, 'name')}</div>
              <div className="line__price">{money(product.price * qty)}</div>
            </div>
            <Stepper value={qty} onChange={(v) => cart.setQty(product.id, v)} size="sm" />
          </div>
        ))}
      </div>

      {upsell && (
        <div className="upsell">
          <SafeImg className="upsell__img" src={upsell.imageUrl} />
          <div className="upsell__text">
            <span dangerouslySetInnerHTML={{ __html: t('upsell', pick(upsell, 'name').replace(/</g, '&lt;')) }} />
            <span className="upsell__price">+{money(upsell.price)}</span>
          </div>
          <Switch
            label="+"
            checked={cart.qtyOf(upsell.id) > 0}
            onChange={(on) => {
              haptic.tap();
              cart.setQty(upsell.id, on ? 1 : 0);
            }}
          />
        </div>
      )}

      <h3 className="block-title">{t('howToGet')}</h3>
      <Segmented
        value={mode}
        onChange={(v) => {
          haptic.tap();
          app.setMode(v);
        }}
        options={[
          { value: 'DELIVERY', label: t('courier'), icon: '🛵', hint: t('etaDelivery') },
          { value: 'PICKUP', label: t('pickup'), icon: '🏃', hint: t('etaPickup') },
        ]}
      />

      {isDelivery ? (
        <div className="panel panel--form" ref={addressRef}>
          <button type="button" className="addr-card" onClick={() => app.openAddress()}>
            <span className="addr-card__icon">
              <PinIcon width={20} height={20} />
            </span>
            <span className="addr-card__body">
              <span className="field__label">{t('address')}</span>
              <span className="addr-card__value">{location?.address || t('chooseAddress')}</span>
              {location?.address && (
                <span className={`addr-card__details ${addressDetails(location) ? '' : 'is-missing'}`}>
                  {addressDetails(location) ||
                    (location.lat != null ? `＋ ${t('detailsMissing')}` : '')}
                </span>
              )}
            </span>
            <span className="link">{t('change')}</span>
          </button>
          {hasCoords ? (
            <div className="geo-row">
              <span className="geo-row__dot" />
              <button type="button" className="link" onClick={() => openLink(yandexMapUrl(location.lat, location.lon))}>
                {t('openInMaps')} <ArrowIcon width={14} height={14} />
              </button>
            </div>
          ) : (
            <p className="geo-hint">{t('noLocationHint')}</p>
          )}
          <label className="field">
            <span className="field__label">{t('courierNote')}</span>
            <input value={addressNote} maxLength={150} placeholder={t('courierNotePh')} onChange={(e) => setAddressNote(e.target.value)} />
          </label>
        </div>
      ) : (
        <div className="panel pickup">
          <div className="pickup__icon">
            <PinIcon />
          </div>
          <div>
            <div className="pickup__label">
              {t('pickupFrom')}
              {app.branch && ` · ${pick(app.branch, 'name') || app.branch.name}`}
            </div>
            <div className="pickup__addr">{app.branch?.address || settings.pickupAddress}</div>
            {app.branch?.workHours && <div className="muted small">🕒 {app.branch.workHours}</div>}
            <div className="pickup__links">
              <button
                type="button"
                className="link"
                onClick={() => openLink(app.branch ? branchMapUrl(app.branch) : yandexSearchUrl(settings.pickupAddress))}
              >
                {t('openInMaps')} <ArrowIcon width={14} height={14} />
              </button>
              {app.branches.length > 1 && (
                <button type="button" className="link" onClick={app.openBranchPicker}>
                  {t('changeBranch')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <h3 className="block-title">{t('phone')}</h3>
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
            <button type="button" className="btn btn--outline btn--icon" onClick={shareTelegramPhone} disabled={phoneLoading} aria-label={t('sendTgPhone')}>
              <PhoneIcon width={18} height={18} />
            </button>
          )}
        </div>
        {tg && !isValidPhone(phone) && (
          <button type="button" className="link" onClick={shareTelegramPhone} disabled={phoneLoading}>
            {phoneLoading ? t('waiting') : t('sendTgPhone')}
          </button>
        )}
      </div>

      <h3 className="block-title">{t('payment')}</h3>
      <Segmented
        value={paymentType}
        onChange={(v) => {
          haptic.tap();
          setPaymentType(v);
        }}
        options={[
          { value: 'CASH', label: t('cash'), icon: '💵' },
          { value: 'CARD', label: t('card'), icon: '💳' },
        ]}
      />
      {paymentType === 'CARD' && (
        <div className="panel">
          {cards.length ? (
            <>
              <p className="muted small">{t('cardHint')}</p>
              {cards.map((c) => (
                <div key={c.number} className="bank-card">
                  <div>
                    <div className="bank-card__bank">{c.bank || t('card')}</div>
                    <div className="bank-card__number">{c.number}</div>
                    {c.holder && <div className="bank-card__holder">{c.holder}</div>}
                  </div>
                  <button
                    type="button"
                    className="btn btn--outline btn--icon"
                    aria-label="copy"
                    onClick={async () => {
                      await copyText(c.number.replace(/\s/g, ''));
                      haptic.success();
                      toast(t('copied'), 'success');
                    }}
                  >
                    <CopyIcon width={18} height={18} />
                  </button>
                </div>
              ))}
              <p className="receipt-rule">{t('receiptRule')}</p>
            </>
          ) : (
            <p className="muted small">{t('cardByStaff', isDelivery ? t('courierWho') : t('cashierWho'))}</p>
          )}
        </div>
      )}

      <h3 className="block-title">{t('comment')}</h3>
      <div className="panel panel--form">
        <input value={comment} maxLength={300} placeholder={t('commentPh')} onChange={(e) => setComment(e.target.value)} />
      </div>

      <div className="panel summary">
        <div className="summary__row">
          <span>{t('products')}</span>
          <span>{money(cart.subtotal)}</span>
        </div>
        <div className="summary__row summary__row--total">
          <span>{t('total')}</span>
          <span>{money(total)}</span>
        </div>
        {isDelivery && <div className="summary__note">🛵 {t('deliveryExtra')}</div>}
        {cart.subtotal < settings.minOrder && <div className="summary__hint summary__hint--red">{t('minOrder', money(settings.minOrder))}</div>}
      </div>

      <div className="checkout-bar">
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={submit} disabled={submitting}>
          {submitting ? (
            t('sending')
          ) : (
            <>
              <span>{t('confirm')}</span>
              <span className="btn__sum">{money(total)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
