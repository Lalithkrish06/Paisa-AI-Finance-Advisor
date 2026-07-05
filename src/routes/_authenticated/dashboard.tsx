import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Expense = {
  id: string;
  amount: number;
  category: string;
  expense_date: string;
  payment_method: string;
  description: string | null;
};

const CATEGORY_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
  "var(--color-chart-9)",
  "var(--color-chart-10)",
];

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function Dashboard() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Expense[];
    },
  });

  const monthlyIncome = Number(profile?.monthly_income ?? 0);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthExpenses = expenses.filter((e) => {
      const d = parseISO(e.expense_date);
      return d >= monthStart && d <= monthEnd;
    });
    const totalExpense = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const balance = monthlyIncome - totalExpense;
    const savingRate = monthlyIncome > 0 ? Math.max(0, (balance / monthlyIncome) * 100) : 0;

    // by category (this month)
    const byCat = new Map<string, number>();
    for (const e of monthExpenses) {
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount));
    }
    const byCategory = [...byCat.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // last 6 months trend
    const trend: { month: string; expense: number; income: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const ms = startOfMonth(m);
      const me = endOfMonth(m);
      const total = expenses
        .filter((e) => {
          const d = parseISO(e.expense_date);
          return d >= ms && d <= me;
        })
        .reduce((s, e) => s + Number(e.amount), 0);
      trend.push({
        month: format(m, "MMM"),
        expense: total,
        income: monthlyIncome,
      });
    }

    return { totalExpense, balance, savingRate, byCategory, trend, monthExpenses };
  }, [expenses, monthlyIncome]);

  const topCategory = stats.byCategory[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Hi{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your money for {format(new Date(), "MMMM yyyy")}.
          </p>
        </div>
        <Link to="/expenses">
          <Button className="gap-2">
            Add expense <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {monthlyIncome === 0 && (
        <div className="card-elevated flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-primary p-4">
          <div className="text-sm">
            <div className="font-medium">Set your monthly income</div>
            <div className="text-muted-foreground">
              Add your income in Profile to unlock saving rate & budget insights.
            </div>
          </div>
          <Link to="/profile">
            <Button variant="outline" size="sm">
              Go to profile
            </Button>
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Monthly income"
          value={fmtINR(monthlyIncome)}
          tone="accent"
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Total expense"
          value={fmtINR(stats.totalExpense)}
          tone="warning"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Current balance"
          value={fmtINR(stats.balance)}
          tone={stats.balance >= 0 ? "success" : "destructive"}
        />
        <StatCard
          icon={<PiggyBank className="h-4 w-4" />}
          label="Saving rate"
          value={`${stats.savingRate.toFixed(0)}%`}
          tone="primary"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-elevated p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Income vs Expense (6 months)</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => fmtINR(v)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="var(--color-chart-4)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Spending by category</h2>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>
          {stats.byCategory.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byCategory}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                  >
                    {stats.byCategory.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                    formatter={(v: number) => fmtINR(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-elevated p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Top categories</h2>
          {stats.byCategory.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="category" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                    formatter={(v: number) => fmtINR(v)}
                  />
                  <Bar dataKey="amount" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card-elevated p-5">
          <h2 className="mb-3 text-base font-semibold">Quick insights</h2>
          <ul className="space-y-3 text-sm">
            <Insight
              label="Biggest category"
              value={topCategory ? `${topCategory.category} — ${fmtINR(topCategory.amount)}` : "—"}
            />
            <Insight
              label="Transactions this month"
              value={`${stats.monthExpenses.length}`}
            />
            <Insight
              label="Average per transaction"
              value={
                stats.monthExpenses.length > 0
                  ? fmtINR(stats.totalExpense / stats.monthExpenses.length)
                  : "—"
              }
            />
            <Insight
              label="Budget status"
              value={
                monthlyIncome === 0
                  ? "Set income first"
                  : stats.balance >= 0
                    ? "On track ✅"
                    : "Over budget ⚠️"
              }
            />
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "primary" | "accent" | "success" | "warning" | "destructive";
}) {
  const toneBg: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${toneBg[tone]}`}>
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </li>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-72 place-items-center text-center text-sm text-muted-foreground">
      <div>
        <div className="mb-1 font-medium text-foreground">No expenses yet</div>
        Add your first expense to see charts.
      </div>
    </div>
  );
}
