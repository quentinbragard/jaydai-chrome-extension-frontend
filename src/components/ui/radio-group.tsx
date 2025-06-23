"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from '@/core/utils/classNames';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("jd-grid jd-gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "jd-aspect-square jd-h-4 jd-w-4 jd-rounded-full jd-border jd-border-primary jd-text-primary jd-shadow focus:jd-outline-none focus-visible:jd-ring-1 focus-visible:jd-ring-ring disabled:jd-cursor-not-allowed disabled:jd-opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="jd-flex jd-items-center jd-justify-center">
        <Circle className="jd-h-4 jd-w-4 jd-fill-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
