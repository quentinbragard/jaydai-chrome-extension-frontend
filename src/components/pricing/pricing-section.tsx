"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/core/utils/classNames"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
}

interface PricingSectionProps {
  tiers: PricingTier[]
  className?: string
}

function PricingSection({ tiers, className }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false)

  const buttonStyles = {
    default: cn(
      "jd-h-12 jd-bg-white jd-dark:jd-bg-zinc-900",
      "hover:jd-bg-zinc-50 dark:jd-hover:jd-bg-zinc-800",
      "jd-text-zinc-900 dark:jd-text-zinc-100",
      "jd-border jd-border-zinc-200 dark:jd-border-zinc-800",
      "hover:jd-border-zinc-300 dark:hover:jd-border-zinc-700",
      "jd-shadow-sm hover:jd-shadow-md",
      "jd-text-sm jd-font-medium",
    ),
    highlight: cn(
      "jd-h-12 jd-bg-zinc-900 dark:jd-bg-zinc-100",
      "hover:jd-bg-zinc-800 dark:jd-hover:jd-bg-zinc-300",
      "jd-text-white dark:jd-text-zinc-900",
      "jd-shadow-[0_1px_15px_rgba(0,0,0,0.1)]",
      "hover:jd-shadow-[0_1px_20px_rgba(0,0,0,0.15)]",
      "jd-font-semibold jd-text-base",
    ),
  }

  const badgeStyles = cn(
    "jd-px-4 jd-py-1.5 jd-text-sm jd-font-medium",
    "jd-bg-zinc-900 dark:jd-bg-zinc-100",
    "jd-text-white dark:jd-text-zinc-900",
    "jd-border-none jd-shadow-lg",
  )

  return (
    <section
      className={cn(
        "jd-relative jd-bg-background jd-text-foreground",
        "jd-py-12 jd-px-4 jd-md:jd-py-24 jd-lg:jd-py-32",
        "jd-overflow-hidden",
        className,
      )}
    >
      <div className="jd-w-full jd-max-w-5xl jd-mx-auto">
        <div className="jd-flex jd-flex-col jd-items-center jd-gap-4 jd-mb-12">
          <h2 className="jd-text-3xl jd-font-bold jd-text-zinc-900 dark:jd-text-zinc-50">
            Simple, transparent pricing
          </h2>
          <div className="jd-inline-flex jd-items-center jd-p-1.5 jd-bg-white dark:jd-bg-zinc-800/50 jd-rounded-full jd-border jd-border-zinc-200 dark:jd-border-zinc-700 jd-shadow-sm">
            {["Monthly", "Yearly"].map((period) => (
              <button
                key={period}
                onClick={() => setIsYearly(period === "Yearly")}
                className={cn(
                  "jd-px-8 jd-py-2.5 jd-text-sm jd-font-medium jd-rounded-full jd-transition-all jd-duration-300",
                  (period === "Yearly") === isYearly
                    ? "jd-bg-zinc-900 dark:jd-bg-zinc-100 jd-text-white dark:jd-text-zinc-900 jd-shadow-lg"
                    : "jd-text-zinc-600 dark:jd-text-zinc-400 jd-hover:jd-text-zinc-900 dark:jd-hover:jd-text-zinc-100",
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="jd-grid jd-grid-cols-1 jd-md:jd-grid-cols-2 jd-gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "jd-relative jd-group jd-backdrop-blur-sm",
                "jd-rounded-3xl jd-transition-all jd-duration-300",
                "jd-flex jd-flex-col",
                tier.highlight
                  ? "jd-bg-gradient-to-b jd-from-zinc-100/80 jd-to-transparent dark:jd-from-zinc-400/[0.15]"
                  : "jd-bg-white dark:jd-bg-zinc-800/50",
                "jd-border",
                tier.highlight
                  ? "jd-border-zinc-400/50 dark:jd-border-zinc-400/20 jd-shadow-xl"
                  : "jd-border-zinc-200 dark:jd-border-zinc-700 jd-shadow-md",
                "hover:translate-y-0 hover:shadow-lg",
              )}
            >
              {tier.badge && tier.highlight && (
                <div className="jd-absolute jd-top-[-4px] jd-left-6">
                  <Badge className={badgeStyles}>{tier.badge}</Badge>
                </div>
              )}

              <div className="jd-p-8 jd-flex-1">
                <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
                  <div
                    className={cn(
                      "jd-p-3 jd-rounded-xl",
                      tier.highlight
                        ? "jd-bg-zinc-100 dark:jd-bg-zinc-800 jd-text-zinc-900 dark:jd-text-zinc-100"
                        : "jd-bg-zinc-100 dark:jd-bg-zinc-800 jd-text-zinc-600 dark:jd-text-zinc-400",
                    )}
                  >
                    {tier.icon}
                  </div>
                  <h3 className="jd-text-xl jd-font-semibold jd-text-zinc-900 dark:jd-text-zinc-100">
                    {tier.name}
                  </h3>
                </div>

                <div className="jd-mb-6">
                  <div className="jd-flex jd-items-baseline jd-gap-2">
                    <span className="jd-text-4xl jd-font-bold jd-text-zinc-900 dark:jd-text-zinc-100">
                      ${isYearly ? tier.price.yearly : tier.price.monthly}
                    </span>
                    <span className="jd-text-sm jd-text-zinc-500 dark:jd-text-zinc-400">
                      /{isYearly ? "year" : "month"}
                    </span>
                  </div>
                  <p className="jd-mt-2 jd-text-sm jd-text-zinc-600 dark:jd-text-zinc-400">
                    {tier.description}
                  </p>
                </div>

                <div className="jd-space-y-4">
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="jd-flex jd-gap-4">
                      <div
                        className={cn(
                          "jd-mt-1 jd-p-0.5 jd-rounded-full jd-transition-colors jd-duration-200",
                          feature.included
                            ? "jd-text-emerald-600 dark:jd-text-emerald-400"
                            : "jd-text-zinc-400 dark:jd-text-zinc-600",
                        )}
                      >
                        <CheckIcon className="jd-w-4 jd-h-4" />
                      </div>
                      <div>
                        <div className="jd-text-sm jd-font-medium jd-text-zinc-900 dark:jd-text-zinc-100">
                          {feature.name}
                        </div>
                        <div className="jd-text-sm jd-text-zinc-500 dark:jd-text-zinc-400">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="jd-p-8 jd-pt-0 jd-mt-auto">
                <Button
                  className={cn(
                    "jd-w-full jd-relative jd-transition-all jd-duration-300",
                    tier.highlight
                      ? buttonStyles.highlight
                      : buttonStyles.default,
                  )}
                >
                  <span className="jd-relative jd-z-10 jd-flex jd-items-center jd-justify-center jd-gap-2">
                    {tier.highlight ? (
                      <>
                        Buy now
                        <ArrowRightIcon className="jd-w-4 jd-h-4" />
                      </>
                    ) : (
                      <>
                        Get started
                        <ArrowRightIcon className="jd-w-4 jd-h-4" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { PricingSection }