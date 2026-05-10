import { useState, useEffect } from 'react';
import { FiArrowUp } from 'react-icons/fi';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-6 z-40 w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lifted flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      aria-label="Scroll to top"
    >
      <FiArrowUp size={18} />
    </button>
  );
}