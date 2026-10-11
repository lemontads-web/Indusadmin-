import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function AnimatedCounter({ value, duration = 2 }) {
  const [count, setCount] = useState(0);
  const suffix = typeof value === 'string' && value.includes('+') ? '+' : (typeof value === 'string' && value.includes('%') ? '%' : '');
  const numericVal = parseInt(String(value).replace(/\D/g, ''), 10);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches || isNaN(numericVal)) {
      setCount(isNaN(numericVal) ? value : numericVal);
      return;
    }

    let frame = 0;
    const totalFrames = Math.round(duration * 60);

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentCount = Math.round(numericVal * (1 - Math.pow(1 - progress, 3)));
      setCount(currentCount);

      if (frame === totalFrames) {
        clearInterval(counter);
      }
    }, 1000 / 60);

    return () => clearInterval(counter);
  }, [value, duration, numericVal]);

  if (isNaN(numericVal)) return <span>{value}</span>;
  return <span>{count}{suffix}</span>;
}

const statsData = [
  { value: '25+', label: 'YEARS OF INDUSTRY EXCELLENCE' },
  { value: '500+', label: 'PRODUCTS OF HEATING RANGE' },
  { value: '100%', label: 'CUSTOM BUILT CAPABILITY' },
];

export default function StatsBar() {
  return (
    <section className="bg-accent text-white py-10 sm:py-12 lg:py-14 w-full">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
          {statsData.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-start text-left"
            >
              <div className="font-heading font-light text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.25] tracking-tight">
                <AnimatedCounter value={stat.value} />
              </div>
              <div className="font-heading font-light text-xs sm:text-sm text-white uppercase tracking-[0.15em] leading-[1.25] mt-2 sm:mt-3">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
