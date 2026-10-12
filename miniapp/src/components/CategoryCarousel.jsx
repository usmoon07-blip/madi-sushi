import { useEffect, useRef } from 'react';
import SafeImg from './SafeImg.jsx';
import { useT } from '../i18n.jsx';

const STEP_MS = 2600; // har necha soniyada bitta kategoriyaga suriladi
const IDLE_MS = 5000; // foydalanuvchi tegsa — shuncha vaqt to'xtab turadi

// Bir qatorli slayd: ekranda doim aniq 3 ta kategoriya, o'zi bittadan suriladi
export default function CategoryCarousel({ categories, onSelect }) {
  const { pick } = useT();
  const trackRef = useRef(null);
  const pausedUntil = useRef(0);

  useEffect(() => {
    if (categories.length <= 3) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setInterval(() => {
      const track = trackRef.current;
      const first = track?.children[0];
      if (!first || Date.now() < pausedUntil.current || document.hidden) return;
      const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      const next = atEnd ? 0 : (Math.round(track.scrollLeft / step) + 1) * step;
      track.scrollTo({ left: next, behavior: 'smooth' });
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [categories.length]);

  const pause = () => {
    pausedUntil.current = Date.now() + IDLE_MS;
  };

  return (
    <div className="carousel">
      <div className="carousel__track" ref={trackRef} onPointerDown={pause} onTouchStart={pause} onWheel={pause}>
        {categories.map((c) => (
          <button key={c.id} type="button" className="carousel__item" onClick={() => onSelect(c)}>
            <span className="carousel__img"><SafeImg src={c.imageUrl} /></span>
            <span className="carousel__name">{pick(c, 'name')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
