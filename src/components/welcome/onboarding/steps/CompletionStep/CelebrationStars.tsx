import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export const CelebrationStars: React.FC = () => (
  <>
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="jd-absolute"
        style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0],
          x: [0, (i % 2 ? 60 : -60) * Math.sin(i * 45 * Math.PI / 180)],
          y: [0, (i % 2 ? 60 : -60) * Math.cos(i * 45 * Math.PI / 180)],
        }}
        transition={{ duration: 1, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
      >
        <Star className="jd-h-4 jd-w-4 jd-text-yellow-300" />
      </motion.div>
    ))}
  </>
);

export default CelebrationStars;
