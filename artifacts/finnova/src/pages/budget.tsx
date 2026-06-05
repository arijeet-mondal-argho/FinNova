import { useState, useEffect } from "react";
import { 
  useGetCurrentAllowance, 
  getGetCurrentAllowanceQueryKey,
  useSetAllowance,
  useGetCategoryBreakdown,
  getGetCategoryBreakdownQueryKey
} from "@workspace/api-client-react";
import { formatBDT, getCategoryIcon, getCategoryColor } from "@/lib/utils-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Slider } from "@/components/ui/slider";

const budgetSchema = z.object({
  totalAmount: z.coerce.number().positive("Total amount must be positive"),
  foodBudget: z.coerce.number().min(0),
  transportBudget: z.coerce.number().min(0),
  savingsBudget: z.coerce.number().min(0),
  studyBudget: z.coerce.number().min(0),
  personalBudget: z.coerce.number().min(0),
}).refine(data => {
  const sum = data.foodBudget + data.transportBudget + data.savingsBudget + data.studyBudget + data.personalBudget;
  return Math.abs(sum - data.totalAmount) < 1; // Allow small rounding differences
}, {
  message: "Allocations must equal the total amount",
  path: ["totalAmount"],
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

export default function Budget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentMonth = format(new Date(), "yyyy-MM");

  const { data: allowance, isLoading: isAllowanceLoading } = useGetCurrentAllowance({
    query: { queryKey: getGetCurrentAllowanceQueryKey() }
  });

  const { data: breakdown, isLoading: isBreakdownLoading } = useGetCategoryBreakdown({
    query: { queryKey: getGetCategoryBreakdownQueryKey() }
  });

  const setAllowanceMutation = useSetAllowance();

  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      totalAmount: 10000,
      foodBudget: 4000,
      transportBudget: 2000,
      savingsBudget: 2000,
      studyBudget: 1000,
      personalBudget: 1000,
    },
  });

  useEffect(() => {
    if (allowance) {
      form.reset({
        totalAmount: allowance.totalAmount,
        foodBudget: allowance.foodBudget,
        transportBudget: allowance.transportBudget,
        savingsBudget: allowance.savingsBudget,
        studyBudget: allowance.studyBudget,
        personalBudget: allowance.personalBudget,
      });
    }
  }, [allowance, form]);

  const onSubmit = (data: BudgetFormValues) => {
    setAllowanceMutation.mutate(
      { data: { ...data, month: currentMonth } },
      {
        onSuccess: () => {
          toast({ title: "Budget updated successfully!" });
          setIsEditing(false);
          queryClient.invalidateQueries({ queryKey: getGetCurrentAllowanceQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCategoryBreakdownQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update budget", variant: "destructive" });
        }
      }
    );
  };

  const isLoading = isAllowanceLoading || isBreakdownLoading;

  // Handle percentages for sliders (distributing 100%)
  const watchAllFields = form.watch();
  const total = watchAllFields.totalAmount || 1;
  
  const categories = [
    { key: "foodBudget", label: "Food", icon: "food" },
    { key: "transportBudget", label: "Transport", icon: "transport" },
    { key: "studyBudget", label: "Study", icon: "study" },
    { key: "personalBudget", label: "Personal", icon: "personal" },
    { key: "savingsBudget", label: "Savings", icon: "savings" },
  ] as const;

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex flex-col mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Monthly Budget</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), "MMMM yyyy")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-2xl" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
      ) : isEditing || !allowance ? (
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>{!allowance ? "Set Initial Budget" : "Edit Budget"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem className="bg-muted/50 p-4 rounded-xl border border-border/50">
                      <FormLabel className="text-base font-bold text-primary">Total Monthly Allowance (৳)</FormLabel>
                      <FormControl>
                        <Input type="number" className="text-lg font-bold h-12 bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 mt-6">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Allocations</h3>
                  
                  {categories.map((cat) => (
                    <FormField
                      key={cat.key}
                      control={form.control}
                      name={cat.key}
                      render={({ field }) => {
                        const percent = Math.round((field.value / total) * 100) || 0;
                        return (
                          <FormItem className="space-y-2">
                            <div className="flex justify-between items-center">
                              <FormLabel className="flex items-center gap-2">
                                <span className="text-lg">{getCategoryIcon(cat.icon)}</span>
                                {cat.label}
                              </FormLabel>
                              <div className="text-right">
                                <span className="font-bold text-sm">{formatBDT(field.value)}</span>
                                <span className="text-xs text-muted-foreground ml-2 w-8 inline-block">{percent}%</span>
                              </div>
                            </div>
                            <FormControl>
                              <div className="flex items-center gap-4">
                                <Slider
                                  value={[percent]}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                  onValueChange={(vals) => {
                                    const newAmount = Math.round((vals[0] / 100) * total);
                                    form.setValue(cat.key, newAmount, { shouldValidate: true });
                                  }}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Allocated:</span>
                      <span className={cn(
                        "font-bold text-sm",
                        Math.abs((categories.reduce((acc, cat) => acc + watchAllFields[cat.key], 0)) - total) > 1 ? "text-destructive" : "text-primary"
                      )}>
                        {formatBDT(categories.reduce((acc, cat) => acc + watchAllFields[cat.key], 0))} / {formatBDT(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {allowance && (
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" className="flex-1" disabled={setAllowanceMutation.isPending}>
                    {setAllowanceMutation.isPending ? "Saving..." : "Save Budget"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative shadow-lg">
            <div className="absolute right-0 top-0 opacity-10 text-8xl -mr-4 -mt-4">👑</div>
            <CardContent className="pt-6 relative z-10">
              <p className="text-sm text-primary-foreground/80 font-medium">Total Allowance</p>
              <div className="text-4xl font-bold mt-1">{formatBDT(allowance.totalAmount)}</div>
              
              <Button 
                variant="secondary" 
                size="sm" 
                className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white border-none"
                onClick={() => setIsEditing(true)}
              >
                Edit Budget Rules
              </Button>
            </CardContent>
          </Card>

          {breakdown && breakdown.length > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Category Utilization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {breakdown.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 font-medium">
                        <span>{getCategoryIcon(cat.category)}</span>
                        <span>{cat.label}</span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="font-bold">{formatBDT(cat.spent)} <span className="text-muted-foreground font-normal text-xs">/ {formatBDT(cat.budget)}</span></span>
                      </div>
                    </div>
                    <div className="relative h-2 w-full bg-muted overflow-hidden rounded-full">
                      <div 
                        className="absolute h-full left-0 top-0 transition-all duration-500 rounded-full"
                        style={{ 
                          width: `${Math.min(cat.percentage, 100)}%`,
                          backgroundColor: cat.percentage > 100 ? 'hsl(var(--destructive))' : getCategoryColor(cat.category)
                        }}
                      />
                    </div>
                    {cat.percentage >= 90 && cat.percentage <= 100 && (
                      <p className="text-[10px] text-destructive font-medium">Nearing limit!</p>
                    )}
                    {cat.percentage > 100 && (
                      <p className="text-[10px] text-destructive font-medium text-right">Over budget by {formatBDT(cat.spent - cat.budget)}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Ensure cn is available since we used it
import { cn } from "@/lib/utils";
