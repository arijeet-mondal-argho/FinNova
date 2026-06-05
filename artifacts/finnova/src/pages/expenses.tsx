import { useState } from "react";
import { 
  useListExpenses,
  getListExpensesQueryKey,
  useCreateExpense,
  useDeleteExpense
} from "@workspace/api-client-react";
import { formatBDT, getCategoryIcon, getCategoryColor } from "@/lib/utils-finance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus, Trash2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function Expenses() {
  const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useListExpenses(
    { month: filterMonth },
    { query: { queryKey: getListExpensesQueryKey({ month: filterMonth }) } }
  );

  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    createExpense.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Expense added successfully!" });
          setIsAddOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey({ month: filterMonth }) });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] }); // Approximate, better to use exact key if available
        },
        onError: () => {
          toast({ title: "Failed to add expense", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteExpense.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Expense deleted" });
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey({ month: filterMonth }) });
        }
      }
    );
  };

  // Group expenses by date
  const groupedExpenses = expenses?.reduce((acc, expense) => {
    if (!acc[expense.date]) {
      acc[expense.date] = [];
    }
    acc[expense.date].push(expense);
    return acc;
  }, {} as Record<string, typeof expenses>);

  const sortedDates = Object.keys(groupedExpenses || {}).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-4 space-y-6 pb-24 min-h-screen bg-background">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Expenses</h1>
        <div className="flex items-center gap-2">
          <Input 
            type="month" 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-36 h-9 text-xs"
          />
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2 rounded-xl h-12 shadow-md">
            <Plus size={18} />
            Add New Expense
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[90vw] max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (৳)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="food">{getCategoryIcon('food')} Food</SelectItem>
                        <SelectItem value="transport">{getCategoryIcon('transport')} Transport</SelectItem>
                        <SelectItem value="study">{getCategoryIcon('study')} Study</SelectItem>
                        <SelectItem value="personal">{getCategoryIcon('personal')} Personal</SelectItem>
                        <SelectItem value="savings">{getCategoryIcon('savings')} Savings</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="What did you buy?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full" disabled={createExpense.isPending}>
                  {createExpense.isPending ? "Adding..." : "Save Expense"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-4 mt-6">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : !expenses || expenses.length === 0 ? (
        <div className="text-center pt-16 pb-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🍃
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-1">No expenses yet</h3>
          <p className="text-sm text-muted-foreground">You haven't spent anything in {format(new Date(filterMonth + "-01"), "MMMM yyyy")}. Keep it up!</p>
        </div>
      ) : (
        <div className="space-y-6 mt-4">
          {sortedDates.map((date) => (
            <div key={date} className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                {format(new Date(date), "EEEE, MMM d")}
              </h3>
              <div className="space-y-2">
                {groupedExpenses![date].map((expense) => (
                  <Card key={expense.id} className="border-border/40 shadow-sm overflow-hidden group">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-muted/50"
                        style={{ color: getCategoryColor(expense.category) }}
                      >
                        {getCategoryIcon(expense.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">{expense.description}</p>
                        <p className="text-xs text-muted-foreground capitalize">{expense.category}</p>
                      </div>
                      
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <p className="font-bold text-sm text-foreground">{formatBDT(expense.amount)}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleDelete(expense.id)}
                          disabled={deleteExpense.isPending}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
