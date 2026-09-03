"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  index?: number;
};

export function MetricCard({ label, value, delta, index = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
      whileHover={{ y: -2, scale: 1.01 }}
    >
      <Card className="rounded-[24px]">
        <CardContent className="p-5">
          <div className="text-sm text-muted-foreground">{label}</div>
          <motion.div
            className="mt-3 text-4xl font-semibold tracking-tight"
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            {value}
          </motion.div>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">{delta}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
