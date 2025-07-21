"use client"

import React from "react"
import { Mail } from "lucide-react"

// WhatsApp Icon Component
export const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images/social_icons/whatsapp.png" alt="WhatsApp" className={className} width={size} height={size} />
)

export const FacebookIcon = ({ size = 24, className = "" }) => (
  <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images/social_icons/facebook.png" alt="Facebook" className={className} width={size} height={size} />
)

export const LinkedInIcon = ({ size = 24, className = "" }) => (
  <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images/social_icons/linkedin.png" alt="LinkedIn" className={className} width={size} height={size} />
)

export const EmailIcon = ({ size = 24, className = "" }) => (
  <Mail className={className} size={size} />
)


