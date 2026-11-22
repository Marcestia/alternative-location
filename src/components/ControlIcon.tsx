const paths = {
  previous: "m15 18-6-6 6-6",
  next: "m9 6 6 6-6 6",
  play: "m8 5 11 7-11 7Z",
  pause: "M8 5v14M16 5v14",
  close: "m6 6 12 12M18 6 6 18",
};

export default function ControlIcon({ kind }: { kind: keyof typeof paths }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" className="inline-block shrink-0 align-middle">
      <path d={paths[kind]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
