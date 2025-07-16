"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/core/utils/classNames"
import { useThemeDetector } from "@/hooks/useThemeDetector"

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
  onSelectPlan?: (billingPeriod: 'monthly' | 'yearly', tier: PricingTier) => void
}

function PricingSection({ tiers, className, onSelectPlan }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false)
  const isDark = useThemeDetector()

  const buttonStyles = {
    default: cn(
      "jd-h-12",
      isDark ? "jd-bg-zinc-900 jd-text-zinc-100 jd-border-zinc-800 hover:jd-bg-zinc-800 hover:jd-border-zinc-700" :
        "jd-bg-white jd-text-zinc-900 jd-border-zinc-200 hover:jd-bg-zinc-50 hover:jd-border-zinc-300",
      "jd-border jd-shadow-sm hover:jd-shadow-md jd-text-sm jd-font-medium"
    ),
    highlight: cn(
      "jd-h-12",
      isDark ? "jd-bg-zinc-100 jd-text-zinc-900 hover:jd-bg-zinc-300" : "jd-bg-zinc-900 jd-text-white hover:jd-bg-zinc-800",
      "jd-shadow-[0_1px_15px_rgba(0,0,0,0.1)] hover:jd-shadow-[0_1px_20px_rgba(0,0,0,0.15)] jd-font-semibold jd-text-base"
    )
  }

  const badgeStyles = cn(
    "jd-px-4 jd-py-1.5 jd-text-sm jd-font-medium jd-border-none jd-shadow-lg",
    isDark ? "jd-bg-zinc-100 jd-text-zinc-900" : "jd-bg-zinc-900 jd-text-white"
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
          <h2 className={cn(
            "jd-text-3xl jd-font-bold",
            isDark ? "jd-text-zinc-50" : "jd-text-zinc-900"
          )}>
            Simple, transparent pricing
          </h2>
          <div
            className={cn(
              "jd-inline-flex jd-items-center jd-p-1.5 jd-rounded-full jd-border jd-shadow-sm",
              isDark ? "jd-bg-zinc-800/50 jd-border-zinc-700" : "jd-bg-white jd-border-zinc-200"
            )}
          >
            {["Monthly", "Yearly"].map((period) => (
              <button
                key={period}
                onClick={() => setIsYearly(period === "Yearly")}
                className={cn(
                  "jd-px-8 jd-py-2.5 jd-text-sm jd-font-medium jd-rounded-full jd-transition-all jd-duration-300",
                  (period === "Yearly") === isYearly
                    ? isDark
                      ? "jd-bg-zinc-100 jd-text-zinc-900 jd-shadow-lg"
                      : "jd-bg-zinc-900 jd-text-white jd-shadow-lg"
                    : isDark
                      ? "jd-text-zinc-400 hover:jd-text-zinc-100"
                      : "jd-text-zinc-600 hover:jd-text-zinc-900"
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
                  ? isDark
                    ? "jd-bg-gradient-to-b jd-from-zinc-400/[0.15] jd-to-transparent"
                    : "jd-bg-gradient-to-b jd-from-zinc-100/80 jd-to-transparent"
                  : isDark
                    ? "jd-bg-zinc-800/50"
                    : "jd-bg-white",
                "jd-border",
                tier.highlight
                  ? isDark
                    ? "jd-border-zinc-400/20 jd-shadow-xl"
                    : "jd-border-zinc-400/50 jd-shadow-xl"
                  : isDark
                    ? "jd-border-zinc-700 jd-shadow-md"
                    : "jd-border-zinc-200 jd-shadow-md",
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
                        ? isDark
                          ? "jd-bg-zinc-800 jd-text-zinc-100"
                          : "jd-bg-zinc-100 jd-text-zinc-900"
                        : isDark
                          ? "jd-bg-zinc-800 jd-text-zinc-400"
                          : "jd-bg-zinc-100 jd-text-zinc-600"
                    )}
                  >
                    {tier.icon}
                  </div>
                  <h3
                    className={cn(
                      "jd-text-xl jd-font-semibold",
                      isDark ? "jd-text-zinc-100" : "jd-text-zinc-900"
                    )}
                  >
                    {tier.name}
                  </h3>
                </div>

                <div className="jd-mb-6">
                  <div className="jd-flex jd-items-baseline jd-gap-2">
                    <span
                      className={cn(
                        "jd-text-4xl jd-font-bold",
                        isDark ? "jd-text-zinc-100" : "jd-text-zinc-900"
                      )}
                    >
                      {isYearly ? tier.price.yearly : tier.price.monthly}
                    </span>
                    <span className={cn("jd-text-sm", isDark ? "jd-text-zinc-400" : "jd-text-zinc-500")}>
                      /{isYearly ? "year" : "month"}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "jd-mt-2 jd-text-sm",
                      isDark ? "jd-text-zinc-400" : "jd-text-zinc-600"
                    )}
                  >
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
                            ? isDark
                              ? "jd-text-emerald-400"
                              : "jd-text-emerald-600"
                            : isDark
                              ? "jd-text-zinc-600"
                              : "jd-text-zinc-400"
                        )}
                      >
                        <CheckIcon className="jd-w-4 jd-h-4" />
                      </div>
                      <div>
                        <div
                          className={cn(
                            "jd-text-sm jd-font-medium",
                            isDark ? "jd-text-zinc-100" : "jd-text-zinc-900"
                          )}
                        >
                          {feature.name}
                        </div>
                        <div className={cn("jd-text-sm", isDark ? "jd-text-zinc-400" : "jd-text-zinc-500")}>
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="jd-p-8 jd-pt-0 jd-mt-auto">
                <Button
                  onClick={() => onSelectPlan?.(isYearly ? 'yearly' : 'monthly', tier)}
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
