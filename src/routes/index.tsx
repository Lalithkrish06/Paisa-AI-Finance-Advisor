import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Shield, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/60 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Paisa</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            AI-powered personal finance
          </div>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
            Understand every rupee you spend.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground md:text-xl">
            Track expenses, see where your money goes, and get intelligent guidance to hit
            your savings goals — with a dashboard that feels like modern banking.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Start tracking free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">
                See features
              </Button>
            </a>
          </div>
        </div>

        {/* Preview card */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="card-elevated overflow-hidden">
            <div className="gradient-hero px-6 py-8 text-primary-foreground">
              <div className="text-sm/6 opacity-80">Current balance</div>
              <div className="mt-1 text-4xl font-semibold tracking-tight">₹ 42,180.00</div>
              <div className="mt-1 text-sm opacity-90">+₹ 3,120 saved this month</div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
              {[
                { label: "Total income", value: "₹ 60,000" },
                { label: "Total expense", value: "₹ 17,820" },
                { label: "Saving rate", value: "30%" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-background p-4">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-xl font-semibold">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Wallet,
              title: "Smart expense tracking",
              desc: "Log spending across 10 categories with payment methods and descriptions in seconds.",
            },
            {
              icon: BarChart3,
              title: "Insightful dashboards",
              desc: "See your money at a glance with clean charts for category, trend and monthly views.",
            },
            {
              icon: Shield,
              title: "Private by default",
              desc: "Row-level security keeps every user's data isolated. Only you can see your finances.",
            },
          ].map((f) => (
            <div key={f.title} className="card-elevated p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          Built with care · Paisa © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
