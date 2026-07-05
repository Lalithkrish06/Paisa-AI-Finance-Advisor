import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  monthly_income: number | null;
  financial_goal: string | null;
};

function ProfilePage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    monthly_income: "",
    financial_goal: "",
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      return (data as Profile | null) ?? null;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        monthly_income: profile.monthly_income ? String(profile.monthly_income) : "",
        financial_goal: profile.financial_goal ?? "",
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const income = form.monthly_income ? Number(form.monthly_income) : 0;
      if (!Number.isFinite(income) || income < 0) throw new Error("Invalid income");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim() || null,
          monthly_income: income,
          financial_goal: form.financial_goal.trim() || null,
        })
        .eq("id", u.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Personalize your finance dashboard.</p>
      </div>

      <div className="card-elevated p-6">
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="income">Monthly income (₹)</Label>
              <Input
                id="income"
                type="number"
                min="0"
                step="1"
                value={form.monthly_income}
                onChange={(e) => setForm((f) => ({ ...f, monthly_income: e.target.value }))}
                placeholder="50000"
              />
              <p className="text-xs text-muted-foreground">
                Used to compute your saving rate and budget insights.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal">Financial goal</Label>
              <Textarea
                id="goal"
                rows={3}
                maxLength={280}
                value={form.financial_goal}
                onChange={(e) => setForm((f) => ({ ...f, financial_goal: e.target.value }))}
                placeholder="e.g. Save ₹1,00,000 for an emergency fund by December."
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
