import React from 'react';

interface Metric {
  label: string;
  value: string;
  description?: string;
}

interface OutcomeMetricsGridProps {
  metrics: Metric[];
}

export const OutcomeMetricsGrid = ({ metrics }: OutcomeMetricsGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric, i) => (
        <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
          <p className="mt-2 text-3xl font-bold text-primary">{metric.value}</p>
          {metric.description && (
            <p className="mt-2 text-xs text-muted-foreground">{metric.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};
