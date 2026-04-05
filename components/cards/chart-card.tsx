import { AppCard } from "@/components/cards/app-card";
import { BarChart, BarChartDatum } from "@/components/charts/bar-chart";
import React, { memo } from "react";

interface ChartCardProps {
  title: string;
  subtitle: string;
  data: BarChartDatum[];
}

export const ChartCard = memo(function ChartCard({
  title,
  subtitle,
  data,
}: ChartCardProps) {
  return (
    <AppCard title={title} subtitle={subtitle}>
      <BarChart data={data} />
    </AppCard>
  );
});
