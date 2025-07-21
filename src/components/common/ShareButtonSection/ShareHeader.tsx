"use client"

import React from "react"
import { motion } from "framer-motion"
import { Share } from "lucide-react"

interface ShareHeaderProps {
  title?: string;
  description?: string;
  index?: number;
  defaultTitle?: string;
}

export const ShareHeader: React.FC<ShareHeaderProps> = ({ 
  title, 
  description, 
  index = 0,
  defaultTitle = 'Partagez cet article'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      className="text-center mb-6"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
        <Share size={24} className="text-primary" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold mb-3">{title || defaultTitle}</h3>
      {description && (
        <p className="text-foreground/70 mb-4 max-w-2xl mx-auto">{description}</p>
      )}
    </motion.div>
  )
}

export default ShareHeader