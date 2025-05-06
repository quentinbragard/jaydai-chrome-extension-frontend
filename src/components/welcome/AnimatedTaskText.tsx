// src/extension/welcome/components/AnimatedTaskText.tsx
import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { getMessage } from '@/core/utils/i18n';

export const AnimatedTaskText: React.FC = () => {
  const [taskIndex, setTaskIndex] = useState(0);
  
  // Tasks for animation
  const tasks = React.useMemo(
    () => [
      getMessage('aiTask1', undefined, 'write professional emails'),
      getMessage('aiTask2', undefined, 'organize complex data'),
      getMessage('aiTask3', undefined, 'create content'),
      getMessage('aiTask4', undefined, 'summarize documents'),
      getMessage('aiTask5', undefined, 'draft reports')
    ],
    []
  );

  // Animation effect for changing tasks
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTaskIndex((prevIndex) => 
        prevIndex === tasks.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [taskIndex, tasks]);

  return (
    <div className="jd-animation-container jd-mb-10 jd-w-full">
      <div className="jd-w-full jd-text-3xl md:jd-text-4xl jd-text-blue-500 jd-font-semibold jd-whitespace-nowrap jd-font-heading jd-flex jd-justify-center">
        <span>{getMessage('useAIToPrefix', undefined, 'Use AI to')} </span>
        <span className="jd-relative jd-inline-block jd-min-w-60 jd-text-left">
          {tasks.map((task, index) => (
            <motion.span
              key={index}
              className="jd-absolute jd-left-0 jd-whitespace-nowrap jd-ml-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: taskIndex === index ? 1 : 0,
                y: taskIndex === index ? 0 : 20
              }}
              transition={{ duration: 0.3 }}
            >
              {task}
            </motion.span>
          ))}
          {/* This maintains space even when animation is changing */}
          <span className="jd-invisible">{tasks[0]}</span>
        </span>
      </div>
    </div>
  );
};

