"use client";

import { ArrowDown, BellRing, Boxes, CheckCheck, Truck } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    title: "Need Detected",
    copy: "Low stock or a blocked shipment kicks off the next action automatically.",
    icon: Boxes,
    tone: "text-secondary",
  },
  {
    title: "Approval Routed",
    copy: "The right manager gets the request with deadlines, ownership, and context attached.",
    icon: CheckCheck,
    tone: "text-primary",
  },
  {
    title: "Supplier Confirmed",
    copy: "Teams align on vendor, quantity, and expected handoff without back-and-forth calls.",
    icon: Truck,
    tone: "text-accent",
  },
  {
    title: "Teams Notified",
    copy: "Warehouse and logistics stay synced as the workflow moves toward receipt or dispatch.",
    icon: BellRing,
    tone: "text-secondary",
  },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="rounded-[26px] border-white/10 bg-slate-950/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <step.icon className={`h-5 w-5 ${step.tone}`} />
            </div>
            <div className="flex-1">
              <Badge variant="default" className="w-fit border-white/10 bg-white/5 text-foreground">
                Step {index + 1}
              </Badge>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.copy}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FlowArrow({ index }: { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center py-2"
      initial={{ opacity: 0, scaleY: 0.4 }}
      animate={inView ? { opacity: 1, scaleY: 1 } : {}}
      transition={{ duration: 0.35, delay: index * 0.08 + 0.12, ease: "easeOut" }}
      style={{ originY: 0 }}
    >
      <div className="h-6 w-px bg-gradient-to-b from-[hsl(184,73%,61%)]/50 to-[hsl(184,73%,61%)]/15" />
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.25, delay: index * 0.08 + 0.28 }}
      >
        <ArrowDown className="h-4 w-4 text-[hsl(184,73%,61%)]" strokeWidth={2.5} />
      </motion.div>
      <div className="h-6 w-px bg-gradient-to-b from-[hsl(184,73%,61%)]/15 to-transparent" />
    </motion.div>
  );
}

export function HomeFlow() {
  return (
    <div className="relative grid gap-0">
      {steps.map((step, index) => (
        <div key={step.title}>
          <StepCard step={step} index={index} />
          {index < steps.length - 1 && <FlowArrow index={index} />}
        </div>
      ))}
    </div>
  );
}
