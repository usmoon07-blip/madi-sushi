import { useEffect, useRef } from 'react';
import { api } from '../api.js';
import { device, printReceipt, printerConfig, usePrinterConfig } from '../printing.js';

const POLL_MS = 4000;

// Yangi buyurtmalar chekini avtomatik chop etadi (faqat "oshxona kompyuteri" deb belgilangan qurilmada)
export default function KitchenPrinter() {
  const config = usePrinterConfig();
  const busy = useRef(false);

  useEffect(() => {
    const load = () =>
      api
        .settings()
        .then(({ settings, printer }) => printerConfig.set({ ...settings, printerError: printer?.lastError || null }))
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const enabled = Boolean(config) && device.isKitchen() && !config.printerIp && config.printMode !== 'OFF';

  useEffect(() => {
    if (!enabled) return undefined;
    const tick = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const { orders } = await api.printQueue();
        for (const order of orders) {
          const { claimed } = await api.claimPrint(order.id);
          if (claimed) await printReceipt(order, { paperWidth: config.paperWidth, copies: config.printCopies });
        }
      } catch {
        /* keyingi urinishda */
      } finally {
        busy.current = false;
      }
    };
    tick();
    const t = setInterval(tick, POLL_MS);
    return () => clearInterval(t);
  }, [enabled, config?.paperWidth, config?.printCopies]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!config) return null;
  let label = 'Chek: o‘chiq';
  let tone = 'off';
  if (config.printMode !== 'OFF') {
    if (config.printerIp) {
      label = config.printerError ? 'Printer: ulanmagan' : 'Chek: tarmoq printeri';
      tone = config.printerError ? 'err' : 'on';
    } else if (device.isKitchen()) {
      label = 'Chek: shu kompyuter';
      tone = 'on';
    } else {
      label = 'Chek: kompyuter tanlanmagan';
      tone = 'warn';
    }
  }
  return (
    <div className={`printer-badge printer-badge--${tone}`} title={config.printerError || ''}>
      🖨 {label}
    </div>
  );
}
