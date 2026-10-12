import { useEffect, useRef, useState } from 'react';
import SafeImg from './SafeImg.jsx';
import { useT } from '../i18n.jsx';

const STEP_MS = 2600; // har necha soniyada keyingisiga o'tadi
const IDLE_MS = 5000; // foydalanuvchi tegsa — shuncha vaqt to'xtab turadi

// Bitta qatorli, o'zi yonga suriladigan kategoriyalar slaydi
export default function CategoryCarousel({ categories, onSelect }) {
  const { pick } = useT();
  const trackRef = useRef(null);
  const pausedUntil = useRef(0);
  const [active, setActive] = useState(0);

  const tiles = () => [...(trackRef.current?.children || [])];

  const goTo = (i, smooth = true) => {
    const track = trackRef.current;
    const el = tiles()[i];
    if (!track || !el) return;
    track.scrollTo({ left: el.offsetLeft - track.offsetLeft - 16, behavior: smooth ? 'smooth' : 'auto' });
  };

  // Avtomatik aylanish
  useEffect(() => {
    if (categories.length < 2) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setInterval(() => {
      const track = trackRef.current;
      if (!track || Date.now() < pausedUntil.current || document.hidden) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      goTo(atEnd ? 0 : active + 1);
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [active, categories.length]);

  // Qaysi plitka chap chetda turganini kuzatish (nuqtalar uchun)
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const left = track.scrollLeft;
    let best = 0;
    tiles().forEach((el, i) => {
      if (Math.abs(el.offsetLeft - track.offsetLeft - 16 - left) < Math.abs(tiles()[best].offsetLeft - track.offsetLeft - 16 - left)) best = i;
    });
    setActive(best);
  };

  const pause = () => {
    pausedUntil.current = Date.now() + IDLE_MS;
  };

  return (
    <div className="carousel">
      <div className="carousel__track" ref={trackRef} onScroll={onScroll} onPointerDown={pause} onTouchStart={pause} onWheel={pause}>
        {categories.map((c) => (
          <button key={c.id} type="button" className="carousel__item" onClick={() => onSelect(c)}>
            <span className="carousel__img"><SafeImg src={c.imageUrl} /></span>
            <span className="carousel__name">{pick(c, 'name')}</span>
          </button>
        ))}
      </div>
      {categories.length > 1 && (
        <div className="carousel__dots">
          {categories.map((c, i) => (
            <button
              key={c.id}
              type="button"
              aria-label={pick(c, 'name')}
              className={i === active ? 'is-active' : ''}
              onClick={() => {
                pause();
                goTo(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
