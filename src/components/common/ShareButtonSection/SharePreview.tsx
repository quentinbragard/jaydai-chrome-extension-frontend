"use client"

import React from "react"
import { motion } from "framer-motion"
import { MessageSquare } from "lucide-react"

interface SharePreviewProps {
  platform: string | null;
  platformLabel?: string;
  previewMessage: string;
  previewTitle?: string;
  previewLabel?: string;
}

export const SharePreview: React.FC<SharePreviewProps> = ({ 
  platform,
  platformLabel = "",
  previewMessage,
  previewTitle = "Aperçu du partage",
  previewLabel = "Aperçu"
}) => {
  if (!platform) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-6 overflow-hidden"
    >
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium flex items-center">
            <MessageSquare size={16} className="mr-2 text-primary" />
            {previewTitle}: {platformLabel}
          </h4>
          <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            {previewLabel}
          </div>
        </div>
        <div className="bg-background/50 p-3 rounded border border-border/50 whitespace-pre-line text-sm">
          {previewMessage}
        </div>
      </div>
    </motion.div>
  );
};

export default SharePreview