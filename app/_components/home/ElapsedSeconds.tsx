import { useEffect, useState } from "react";

// Owns its own interval so the 10 Hz tick re-renders only this text, not the whole page.
export function ElapsedSeconds({ since }: { since: number }) {
  const [now, setNow] = useState(since);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);
  return <>{(Math.max(0, now - since) / 1000).toFixed(1)}s</>;
}
