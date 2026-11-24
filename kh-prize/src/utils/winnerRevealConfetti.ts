import confetti from 'canvas-confetti';

const PRESENTATION_HOST_SELECTOR = '[data-presentation-host]';

const confettiByRoot = new WeakMap<
  HTMLElement,
  ReturnType<typeof confetti.create>
>();

function resolveConfettiRoot(): HTMLElement {
  const fs = document.fullscreenElement;
  if (fs instanceof HTMLElement) return fs;

  const host = document.querySelector(PRESENTATION_HOST_SELECTOR);
  if (host instanceof HTMLElement && host.classList.contains('fixed')) {
    return host;
  }

  return document.body;
}

function getConfettiShoot(root: HTMLElement) {
  let shoot = confettiByRoot.get(root);
  if (shoot) return shoot;

  let canvas = root.querySelector(
    'canvas[data-winner-confetti]'
  ) as HTMLCanvasElement | null;

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.setAttribute('data-winner-confetti', '');
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:400;';
    root.appendChild(canvas);
  }

  shoot = confetti.create(canvas, { resize: true, useWorker: false });
  confettiByRoot.set(root, shoot);
  return shoot;
}

/** 得獎／一連抽名單 popup 出現時的花紙（全屏元素內繪製，否則全屏下看不見） */
export function fireWinnerRevealConfetti(
  isBlindbox: boolean,
  variant: 'single' | 'batch'
) {
  const run = () => {
    const shoot = getConfettiShoot(resolveConfettiRoot());
    const particleCount =
      variant === 'batch' ? (isBlindbox ? 140 : 180) : isBlindbox ? 120 : 160;

    shoot({
      particleCount,
      spread: 90,
      origin: { y: 0.55 },
    });

    window.setTimeout(() => {
      shoot({
        particleCount: Math.round(particleCount * 0.45),
        spread: 70,
        origin: { y: 0.35, x: 0.25 },
      });
      shoot({
        particleCount: Math.round(particleCount * 0.45),
        spread: 70,
        origin: { y: 0.35, x: 0.75 },
      });
    }, 180);
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}