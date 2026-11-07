import { startEye } from "./engine";

declare global {
  interface Window {
    startVeyraEye: typeof startEye;
  }
}

window.startVeyraEye = (canvas: HTMLCanvasElement, onLabel?: (s: string) => void) =>
  startEye(canvas, onLabel ?? (() => {}));
