/**
 * Global ambient background — haze only, never over type.
 * Text sits on opaque canvas/cards; these washes live at -z-10 in empty sky.
 */
export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-canvas" aria-hidden="true">
      <div
        className="absolute inset-x-0 -top-[18vh] h-[65vh]"
        style={{ background: 'radial-gradient(ellipse 90% 55% at 55% 0%, var(--nx-deco-2) 0%, transparent 68%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[50vh]"
        style={{ background: 'radial-gradient(ellipse 95% 65% at 50% 115%, var(--nx-deco-1) 0%, transparent 72%)' }}
      />
      <div
        className="absolute bottom-[-8%] left-[-8%] w-[42vw] h-[42vw] max-w-[560px] max-h-[560px] rounded-full blur-[100px] hidden md:block"
        style={{ background: 'radial-gradient(circle, var(--nx-deco-3) 0%, transparent 62%)' }}
      />
      <div
        className="absolute top-[30%] right-[-12%] w-[38vw] h-[38vw] max-w-[480px] max-h-[480px] rounded-full blur-[110px] hidden lg:block"
        style={{ background: 'radial-gradient(circle, var(--nx-deco-1) 0%, transparent 65%)' }}
      />
    </div>
  )
}
