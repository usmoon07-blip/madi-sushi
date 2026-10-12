import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { toast } from '../store.jsx';
import { useApp } from '../appState.jsx';
import { LANG_NAMES, useT } from '../i18n.jsx';
import { haptic, onBackButton, openLink } from '../telegram.js';
import { yandexSearchUrl } from '../format.js';
import ProductCard from '../components/ProductCard.jsx';
import Logo from '../components/Logo.jsx';
import {
  ArrowIcon,
  ChevronIcon,
  GlobeIcon,
  HeartIcon,
  InfoIcon,
  MenuListIcon,
  PhoneIcon,
  PinIcon,
  StarIcon,
  StoreIcon,
} from '../components/Icons.jsx';

// 3-rasmdagidek: faqat kerakli bo'limlar ro'yxati
export default function Profile() {
  const { t, lang } = useT();
  const app = useApp();
  const [sub, setSub] = useState(null);

  useEffect(() => {
    if (!sub) return undefined;
    window.scrollTo({ top: 0 });
    return onBackButton(() => setSub(null));
  }, [sub]);

  const items = [
    { id: 'favorites', icon: <HeartIcon />, label: t('favorites'), badge: app.favorites.size || null },
    { id: 'menu', icon: <MenuListIcon />, label: t('menu'), action: () => app.openMenu() },
    { id: 'branches', icon: <PinIcon />, label: t('branches') },
    { id: 'contacts', icon: <PhoneIcon />, label: t('contacts') },
    { id: 'about', icon: <InfoIcon />, label: t('about') },
    { id: 'review', icon: <StarIcon />, label: t('leaveReview') },
    { id: 'language', icon: <GlobeIcon />, label: t('language'), value: LANG_NAMES[lang] },
  ];

  if (sub) {
    const title = items.find((i) => i.id === sub)?.label;
    return (
      <div className="page">
        <div className="subhead">
          <button type="button" className="subhead__back" onClick={() => setSub(null)} aria-label={t('back')}>
            <ChevronIcon dir="left" />
          </button>
          <h1 className="page__title">{title}</h1>
        </div>
        {sub === 'favorites' && <Favorites />}
        {sub === 'branches' && <Branches />}
        {sub === 'contacts' && <Contacts />}
        {sub === 'about' && <About />}
        {sub === 'review' && <Review onDone={() => setSub(null)} />}
        {sub === 'language' && <Language onDone={() => setSub(null)} />}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="profile-head">
        <div className="avatar">{(app.user?.firstName || '?').slice(0, 1).toUpperCase()}</div>
        <div>
          <div className="profile__name">{[app.user?.firstName, app.user?.lastName].filter(Boolean).join(' ') || t('guest')}</div>
          {app.user?.phone && <div className="muted small">{app.user.phone}</div>}
        </div>
      </div>
      <div className="plist">
        {items.map((i) => (
          <button
            key={i.id}
            type="button"
            className="plist__item"
            onClick={() => {
              haptic.tap();
              if (i.action) i.action();
              else setSub(i.id);
            }}
          >
            <span className="plist__icon">{i.icon}</span>
            <span className="plist__label">{i.label}</span>
            {i.badge && <span className="plist__badge">{i.badge}</span>}
            {i.value && <span className="plist__value">{i.value}</span>}
            <ChevronIcon width={20} height={20} className="plist__chev" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Favorites() {
  const { t } = useT();
  const app = useApp();
  const list = app.products.filter((p) => app.favorites.has(p.id));
  if (!list.length) return <div className="panel muted">{t('noFavorites')}</div>;
  return (
    <div className="grid">
      {list.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function Branches() {
  const { t } = useT();
  const { settings } = useApp();
  return (
    <div className="panel branch">
      <div className="branch__icon">
        <StoreIcon />
      </div>
      <div className="branch__body">
        <div className="branch__name">Madi Sushi</div>
        <div className="branch__addr">{settings.pickupAddress}</div>
        {settings.workHours && (
          <div className="muted small">
            🕒 {t('workHours')}: {settings.workHours}
          </div>
        )}
        <div className="branch__actions">
          <button type="button" className="btn btn--outline" onClick={() => openLink(yandexSearchUrl(settings.pickupAddress))}>
            <PinIcon width={18} height={18} /> {t('openInMaps')}
          </button>
          {settings.contactPhone && (
            <a className="btn btn--outline" href={`tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`}>
              <PhoneIcon width={18} height={18} /> {t('call')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Contacts() {
  const { t } = useT();
  const { settings } = useApp();
  const rows = [
    settings.contactPhone && {
      icon: <PhoneIcon width={20} height={20} />,
      label: t('phoneLabel'),
      value: settings.contactPhone,
      href: `tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`,
    },
    settings.instagram && {
      icon: <span className="ig">IG</span>,
      label: 'Instagram',
      value: `@${settings.instagram}`,
      link: `https://instagram.com/${settings.instagram}`,
    },
    {
      icon: <PinIcon width={20} height={20} />,
      label: t('branches'),
      value: settings.pickupAddress,
      link: yandexSearchUrl(settings.pickupAddress),
    },
  ].filter(Boolean);
  return (
    <div className="panel contact">
      {rows.map((r) =>
        r.href ? (
          <a key={r.label} className="contact__row" href={r.href}>
            {r.icon}
            <span>
              <span className="muted small block">{r.label}</span>
              {r.value}
            </span>
            <ArrowIcon width={14} height={14} />
          </a>
        ) : (
          <button key={r.label} type="button" className="contact__row" onClick={() => openLink(r.link)}>
            {r.icon}
            <span>
              <span className="muted small block">{r.label}</span>
              {r.value}
            </span>
            <ArrowIcon width={14} height={14} />
          </button>
        )
      )}
    </div>
  );
}

function About() {
  const { lang } = useT();
  const { settings } = useApp();
  const text = (lang === 'ru' ? settings.aboutRu : settings.aboutUz) || settings.aboutUz || settings.aboutRu;
  return (
    <div className="panel about">
      <div className="about__logo">
        <Logo size={132} />
      </div>
      <p>{text}</p>
    </div>
  );
}

function Review({ onDone }) {
  const { t } = useT();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!rating) return toast(t('reviewNeedRating'), 'error');
    setBusy(true);
    try {
      await api.review(rating, text.trim());
      haptic.success();
      toast(t('reviewThanks'), 'success');
      onDone();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel review">
      <p className="review__title">{t('reviewTitle')}</p>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={n <= rating ? 'is-on' : ''}
            onClick={() => {
              haptic.tap();
              setRating(n);
            }}
            aria-label={`${n}`}
          >
            <StarIcon filled={n <= rating} width={36} height={36} />
          </button>
        ))}
      </div>
      <textarea rows={4} maxLength={1000} placeholder={t('reviewPh')} value={text} onChange={(e) => setText(e.target.value)} />
      <button type="button" className="btn btn--primary btn--block" onClick={send} disabled={busy}>
        {busy ? t('sending') : t('reviewSend')}
      </button>
    </div>
  );
}

function Language({ onDone }) {
  const { lang, setLang } = useT();
  return (
    <div className="plist">
      {Object.entries(LANG_NAMES).map(([code, name]) => (
        <button
          key={code}
          type="button"
          className="plist__item"
          onClick={() => {
            haptic.tap();
            setLang(code);
            onDone();
          }}
        >
          <span className="plist__icon">{code === 'uz' ? '🇺🇿' : '🇷🇺'}</span>
          <span className="plist__label">{name}</span>
          {lang === code && <span className="plist__check">✓</span>}
        </button>
      ))}
    </div>
  );
}
