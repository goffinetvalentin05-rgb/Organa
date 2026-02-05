"use client";

import { useI18n } from "@/components/I18nProvider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface EventFinancialChartProps {
  revenue: number;
  expenses: number;
}

export default function EventFinancialChart({
  revenue,
  expenses,
}: EventFinancialChartProps) {
  const { t } = useI18n();

  const data = [
    {
      name: t("dashboard.events.detail.chart.revenue"),
      value: revenue,
      fill: "#22c55e", // green-500
    },
    {
      name: t("dashboard.events.detail.chart.expenses"),
      value: expenses,
      fill: "#ef4444", // red-500
    },
  ];

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 shadow-lg rounded-lg border border-slate-200">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-lg" style={{ color: payload[0].payload.fill }}>
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-secondary mb-4">
        {t("dashboard.events.detail.chart.title")}
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickFormatter={(value) => formatValue(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              maxBarSize={120}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
