import { useState } from "react";
import { 
  useListGoals, 
  getListGoalsQueryKey,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal
} from "@workspace/api-client-react";
import { formatBDT } from "@/lib/utils-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus, Target, Trophy, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

const goalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
  savedAmount: z.coerce.number().min(0, "Saved amount cannot be negative"),
  deadline: z.string().optional().nullable(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export default function Goals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);

  const { data: goals, isLoading } = useListGoals({
    query: { queryKey: getListGoalsQueryKey() }
  });

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      targetAmount: 0,
      savedAmount: 0,
      deadline: "",
    },
  });

  const onSubmit = (data: GoalFormValues) => {
    // If deadline is empty string, convert to null for API
    const submitData = {
      ...data,
      deadline: data.deadline || null
    };

    if (editingGoalId) {
      updateGoal.mutate(
        { id: editingGoalId, data: submitData },
        {
          onSuccess: () => {
            toast({ title: "Goal updated successfully!" });
            setIsAddOpen(false);
            setEditingGoalId(null);
            form.reset();
            queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
          }
        }
      );
    } else {
      createGoal.mutate(
        { data: submitData },
        {
          onSuccess: () => {
            toast({ title: "Goal created successfully!" });
            setIsAddOpen(false);
            form.reset();
            queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
          }
        }
      );
    }
  };

  const handleEdit = (goal: any) => {
    form.reset({
      title: goal.title,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount,
      deadline: goal.deadline || "",
    });
    setEditingGoalId(goal.id);
    setIsAddOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteGoal.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Goal deleted" });
          queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
        }
      }
    );
  };

  const markCompleted = (id: number) => {
    updateGoal.mutate(
      { id, data: { completed: true } },
      {
        onSuccess: () => {
          toast({ title: "Awesome! Goal completed! 🎉" });
          queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
        }
      }
    );
  };

  const openNewForm = () => {
    setEditingGoalId(null);
    form.reset({ title: "", targetAmount: 0, savedAmount: 0, deadline: "" });
    setIsAddOpen(true);
  };

  const activeGoals = goals?.filter(g => !g.completed) || [];
  const completedGoals = goals?.filter(g => g.completed) || [];

  return (
    <div className="p-4 space-y-6 pb-24 min-h-screen bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Savings Goals</h1>
          <p className="text-sm text-muted-foreground">Dream big, save smart.</p>
        </div>
        <div className="bg-primary/10 p-2 rounded-full text-primary">
          <Target size={24} />
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <Button className="w-full gap-2 rounded-xl h-12 shadow-md" onClick={openNewForm}>
          <Plus size={18} />
          Create New Goal
        </Button>
        <DialogContent className="w-[90vw] max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingGoalId ? "Edit Goal" : "Create Goal"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New Laptop, Eid Trip..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount (৳)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="savedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Already Saved (৳)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full" disabled={createGoal.isPending || updateGoal.isPending}>
                  {(createGoal.isPending || updateGoal.isPending) ? "Saving..." : "Save Goal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : goals?.length === 0 ? (
        <div className="text-center pt-16 pb-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🌱
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-1">Plant a seed</h3>
          <p className="text-sm text-muted-foreground px-4">Set a savings goal and watch your money grow over time.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeGoals.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">In Progress</h3>
              {activeGoals.map(goal => {
                const percent = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
                return (
                  <Card key={goal.id} className="border-border/50 shadow-sm relative overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg leading-tight">{goal.title}</h4>
                          {goal.deadline && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Target: {format(new Date(goal.deadline), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleEdit(goal)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(goal.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-primary">{formatBDT(goal.savedAmount)} saved</span>
                          <span className="text-muted-foreground">of {formatBDT(goal.targetAmount)}</span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>

                      {percent >= 100 && (
                        <Button 
                          className="w-full bg-chart-2 hover:bg-chart-2/90 text-white gap-2 font-bold"
                          onClick={() => markCompleted(goal.id)}
                        >
                          <CheckCircle2 size={18} />
                          Mark as Completed
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Trophy size={16} className="text-chart-4" /> 
                Achievements Unlocked
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {completedGoals.map(goal => (
                  <Card key={goal.id} className="bg-muted/30 border-muted relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 text-chart-4 opacity-50">🏆</div>
                    <CardContent className="p-3">
                      <h4 className="font-bold text-sm line-through text-muted-foreground decoration-muted-foreground/30 truncate">{goal.title}</h4>
                      <p className="text-xs font-semibold mt-1">{formatBDT(goal.targetAmount)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}