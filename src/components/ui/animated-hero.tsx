import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["amazing", "new", "wonderful", "beautiful", "smart"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="jd-w-full">
      <div className="jd-container jd-mx-auto">
        <div className="jd-flex jd-gap-8 jd-py-20 jd-lg:jd-py-40 jd-items-center jd-justify-center jd-flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Read our launch article <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="jd-flex jd-gap-4 jd-flex-col">
            <h1 className="jd-text-5xl jd-md:jd-text-7xl jd-max-w-2xl jd-tracking-tighter jd-text-center jd-font-regular">
              <span className="jd-text-spektr-cyan-50">This is something</span>
              <span className="jd-relative jd-flex jd-w-full jd-justify-center jd-overflow-hidden jd-text-center jd-md:jd-pb-4 jd-md:jd-pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="jd-absolute jd-font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="jd-text-lg jd-md:jd-text-xl jd-leading-relaxed jd-tracking-tight jd-text-muted-foreground jd-max-w-2xl jd-text-center">
              Managing a small business today is already tough. Avoid further
              complications by ditching outdated, tedious trade methods. Our
              goal is to streamline SMB trade, making it easier and faster than
              ever.
            </p>
          </div>
          <div className="jd-flex jd-flex-row jd-gap-3">
            <Button size="lg" className="jd-gap-4" variant="outline">
              Jump on a call <PhoneCall className="jd-w-4 jd-h-4" />
            </Button>
            <Button size="lg" className="jd-gap-4">
              Sign up here <MoveRight className="jd-w-4 jd-h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
