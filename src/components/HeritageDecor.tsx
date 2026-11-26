function LotusMotif() {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.25">
        <path d="M48 75c-18 0-30-10-30-21 13 0 24 6 30 18 6-12 17-18 30-18 0 11-12 21-30 21Z" />
        <path d="M48 70C32 55 31 39 48 22c17 17 16 33 0 48Z" />
        <path d="M42 67C25 59 20 45 27 31c14 8 20 20 15 36Zm12 0c17-8 22-22 15-36-14 8-20 20-15 36Z" />
        <circle cx="48" cy="72" r="29" strokeDasharray="2 5" />
      </g>
    </svg>
  );
}

export function HeritageDecor() {
  return (
    <div className="heritage-decor" aria-hidden="true">
      <span className="heritage-motif motif-one"><LotusMotif /></span>
      <span className="heritage-motif motif-two"><LotusMotif /></span>
      <span className="heritage-motif motif-three"><LotusMotif /></span>
      <span className="heritage-motif motif-four"><LotusMotif /></span>
      <span className="heritage-motif motif-five"><LotusMotif /></span>
      <span className="heritage-motif motif-six"><LotusMotif /></span>
    </div>
  );
}
