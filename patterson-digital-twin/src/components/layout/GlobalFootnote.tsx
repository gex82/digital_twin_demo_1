export function GlobalFootnote() {
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 6,
        textAlign: 'center',
        fontSize: 10,
        color: 'rgba(226, 232, 240, 0.72)',
        letterSpacing: '0.01em',
        zIndex: 1100,
        pointerEvents: 'none',
      }}
    >
      For more information, please reach out to ely.x.colon@accenture.com
    </div>
  );
}
