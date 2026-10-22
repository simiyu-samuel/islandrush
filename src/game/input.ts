import type { GameBridge } from './bridge';

/** DOM listeners keep key capture local to active play, including after a modal. */
export function bindRunnerInput(canvas: HTMLCanvasElement, bridge: GameBridge): () => void {
  let pointer: { id: number; x: number; y: number } | undefined;
  const active = () => {
    const frame = bridge.read();
    return frame.view === 'run' && frame.phase === 'active';
  };
  const isControl = (target: EventTarget | null) => target instanceof HTMLElement &&
    Boolean(target.closest('input, textarea, select, button, [contenteditable="true"], [role="dialog"]'));
  const keydown = (event: KeyboardEvent) => {
    if (!active() || isControl(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.code) {
      case 'ArrowLeft': case 'KeyA':
        event.preventDefault();
        bridge.move(-1);
        break;
      case 'ArrowRight': case 'KeyD':
        event.preventDefault();
        bridge.move(1);
        break;
      case 'ArrowUp': case 'KeyW': case 'Space':
        event.preventDefault();
        if (!event.repeat) bridge.jump();
        break;
      case 'Escape': case 'KeyP':
        event.preventDefault();
        if (!event.repeat) bridge.pause();
        break;
    }
  };
  const down = (event: PointerEvent) => {
    if (!active()) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const up = (event: PointerEvent) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const start = pointer;
    pointer = undefined;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (!active()) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const threshold = Math.max(24, Math.min(46, canvas.clientWidth * 0.065));
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= threshold) bridge.move(dx < 0 ? -1 : 1);
    else if (dy <= -threshold) bridge.jump();
  };
  const cancel = () => { pointer = undefined; };
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Island Rush game. Arrow keys or A and D change lane. Space or Up jumps. Escape pauses.');
  canvas.style.touchAction = 'none';
  window.addEventListener('keydown', keydown);
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', cancel);
  return () => {
    window.removeEventListener('keydown', keydown);
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', cancel);
  };
}
