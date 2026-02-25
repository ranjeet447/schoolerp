"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@schoolerp/ui";
import { toast } from "sonner";

type BalanceRow = {
  wallet_type: string;
  balance: number;
  included_granted_month: number;
  topups_month: number;
  used_month: number;
};

type LedgerEntry = {
  id: string;
  wallet_type: string;
  entry_type: string;
  amount: number;
  source: string;
  reference_id: string;
  created_at: string;
};

export default function BillingCreditsPage() {
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [walletType, setWalletType] = useState("sms_credits");
  const [amount, setAmount] = useState("1000");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, lRes] = await Promise.all([
        apiClient("/admin/billing/credits/balance"),
        apiClient("/admin/billing/credits/ledger?limit=20"),
      ]);
      if (bRes.ok) {
        const data = await bRes.json();
        setBalances(Array.isArray(data?.balances) ? data.balances : []);
      }
      if (lRes.ok) {
        const data = await lRes.json();
        setLedger(Array.isArray(data?.ledger) ? data.ledger : []);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load credits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const requestTopup = async () => {
    setSubmitting(true);
    try {
      const parsed = Number(amount);
      const res = await apiClient("/admin/billing/credits/topup", {
        method: "POST",
        body: JSON.stringify({ wallet_type: walletType, amount: Number.isFinite(parsed) ? parsed : 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to request top-up");
      toast.success("Credit top-up request submitted");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to request top-up");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Credits</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Included monthly allowances + top-ups. Messaging is blocked when balance is insufficient.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(loading ? ["sms_credits", "whatsapp_credits", "email_credits", "ai_credits"] : balances).map((item: any, idx) => {
          if (loading) {
            return <Card key={idx}><CardContent className="p-4 text-sm text-muted-foreground">Loading...</CardContent></Card>;
          }
          const row = item as BalanceRow;
          return (
            <Card key={row.wallet_type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{row.wallet_type}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Balance:</span> <span className="font-semibold">{row.balance}</span></p>
                <p><span className="text-muted-foreground">Included (month):</span> {row.included_granted_month}</p>
                <p><span className="text-muted-foreground">Top-ups (month):</span> {row.topups_month}</p>
                <p><span className="text-muted-foreground">Used (month):</span> {row.used_month}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Buy Credits (Top-up Request)</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
          <div className="grid gap-2">
            <Label>Wallet Type</Label>
            <Input value={walletType} onChange={(e) => setWalletType(e.target.value)} placeholder="sms_credits" />
          </div>
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" />
          </div>
          <Button type="button" onClick={() => void requestTopup()} disabled={submitting}>
            {submitting ? "Submitting..." : "Request Top-up"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Credit Ledger</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Wallet</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Reference</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr><td className="py-3 text-muted-foreground" colSpan={6}>No ledger entries yet.</td></tr>
              ) : ledger.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="py-2 pr-3">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-3">{row.wallet_type}</td>
                  <td className="py-2 pr-3">{row.entry_type}</td>
                  <td className="py-2 pr-3">{row.amount}</td>
                  <td className="py-2 pr-3">{row.source}</td>
                  <td className="py-2 pr-3 max-w-[260px] truncate">{row.reference_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
