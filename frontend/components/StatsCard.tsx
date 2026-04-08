"use client";

interface Stat {
  label: string;
  value: string | number;
  unit?: string;
}

interface StatsCardProps {
  title: string;
  stats: Stat[];
}

export default function StatsCard({ title, stats }: StatsCardProps) {
  return (
    <div className="card bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/30">
      <h3 className="text-lg font-bold text-text-primary mb-4 font-fira-code">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx}>
            <p className="text-text-tertiary text-sm mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-text-primary">
              {stat.value}
              {stat.unit && (
                <span className="text-sm text-text-secondary ml-1">
                  {stat.unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
