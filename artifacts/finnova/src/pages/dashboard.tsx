import { useState } from "react";
import { 
  useGetDashboardSummary, 
  getGetDashboardSummaryQueryKey,
  useGetCategoryBreakdown,
  getGetCategoryBreakdownQueryKey,
  useGetMonthlyTrend,
  getGetMonthlyTrendQueryKey
} from "@workspace/api-client-react";
import { formatBDT, getCategoryColor, getCategoryIcon } from "@/lib/utils-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PlusCircle, TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { format, subMonths } from "date-fns";

export default function Dashboard() {
  const currentMonth = format(new Date(), "yyyy-MM");
  
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey()
    }
  });

  const { data: categoryBreakdown, isLoading: isLoadingBreakdown } = useGetCategoryBreakdown({
    query: {
      queryKey: getGetCategoryBreakdownQueryKey()
    }
  });

  const { data: monthlyTrend, isLoading: isLoadingTrend } = useGetMonthlyTrend({
    query: {
      queryKey: getGetMonthlyTrendQueryKey()
    }
  });

  const isLoading = isLoadingSummary || isLoadingBreakdown || isLoadingTrend;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-[100px] w-full rounded-xl" />
          <Skeleton className="h-[100px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "MMMM yyyy")}</p>
        </div>
        <div className="bg-primary/10 p-2 rounded-full text-primary">
          <Sparkles size={24} />
        </div>
      </div>

      {summary ? (
        <div className="space-y-6">
          {/* Main Balance Card */}
          <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-8 -mb-8" />
            
            <CardContent className="pt-6 relative z-10">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-primary-foreground/80">Available Balance</p>
                {summary.budgetUtilization > 90 && (
                  <div className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
                    <AlertCircle size={12} />
                    High Usage
                  </div>
                )}
              </div>
              
              <div className="text-4xl font-extrabold mb-6 tracking-tight">
                {formatBDT(summary.totalRemaining)}
              </div>
              
              <div className="flex justify-between text-sm bg-black/10 p-3 rounded-xl backdrop-blur-sm">
                <div>
                  <p className="text-primary-foreground/70 mb-1 text-xs uppercase tracking-wider">Spent</p>
                  <p className="font-bold">{formatBDT(summary.totalSpent)}</p>
                </div>
                <div className="w-px bg-white/20 mx-2" />
                <div className="text-right">
                  <p className="text-primary-foreground/70 mb-1 text-xs uppercase tracking-wider">Allowance</p>
                  <p className="font-bold">{formatBDT(summary.totalAllowance)}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-primary-foreground/80">Month Progress</span>
                  <span className="text-xs font-bold">{summary.budgetUtilization}%</span>
                </div>
                <Progress 
                  value={summary.budgetUtilization} 
                  className="h-1.5 bg-black/20" 
                  indicatorClassName={summary.budgetUtilization > 90 ? "bg-destructive" : "bg-white"}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Link href="/expenses" className="flex-1">
              <Button className="w-full gap-2 shadow-md h-12 rounded-xl" size="lg">
                <PlusCircle size={18} />
                Add Expense
              </Button>
            </Link>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <div className="w-10 h-10 rounded-full bg-chart-3/10 text-chart-3 flex items-center justify-center mb-2">
                  <TrendingUp size={20} />
                </div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Savings Rate</p>
                <p className="text-xl font-bold text-foreground">{summary.savingsRate}%</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <div className="w-10 h-10 rounded-full bg-chart-2/10 text-chart-2 flex items-center justify-center mb-2">
                  <span className="text-lg">💰</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Saved</p>
                <p className="text-xl font-bold text-foreground">{formatBDT(summary.totalSaved)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          {categoryBreakdown && categoryBreakdown.length > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Where is it going?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown.filter(c => c.spent > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="spent"
                      >
                        {categoryBreakdown.filter(c => c.spent > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatBDT(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 mt-4">
                  {categoryBreakdown.filter(c => c.spent > 0).sort((a,b) => b.spent - a.spent).slice(0, 3).map(cat => (
                    <div key={cat.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(cat.category)}</span>
                        <span className="font-medium text-foreground/80">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatBDT(cat.spent)}</span>
                        <span className="text-xs text-muted-foreground w-8 text-right">{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Motivational Quote */}
          <div className="bg-gradient-to-r from-accent/50 to-accent p-5 rounded-xl border border-accent relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 text-4xl opacity-10">💡</div>
            <p className="text-sm font-serif italic text-foreground/80 relative z-10">
              "The habit of saving is itself an education; it fosters every virtue, teaches self-denial, cultivates the sense of order, trains to forethought, and so broadens the mind."
            </p>
            <p className="text-xs font-bold text-primary mt-2 uppercase tracking-wide">— T.T. Munger</p>
          </div>
          
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-10 pb-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-2xl">
              🎯
            </div>
            <h3 className="font-bold text-lg mb-2">Set your budget to start</h3>
            <p className="text-sm text-muted-foreground mb-6">
              You haven't set up an allowance for this month yet.
            </p>
            <Link href="/budget">
              <Button>Set Up Budget</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
