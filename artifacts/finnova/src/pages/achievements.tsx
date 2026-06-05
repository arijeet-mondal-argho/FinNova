import { useListAchievements, getListAchievementsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock, Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Achievements() {
  const { data: achievements, isLoading } = useListAchievements({
    query: { queryKey: getListAchievementsQueryKey() }
  });

  const unlockedCount = achievements?.filter(a => a.unlocked).length || 0;
  const totalCount = achievements?.length || 0;

  return (
    <div className="p-4 space-y-6 pb-24 min-h-screen bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <Trophy className="text-chart-4" /> Awards
          </h1>
          <p className="text-sm text-muted-foreground">Your financial journey milestones.</p>
        </div>
      </div>

      {!isLoading && (
        <Card className="bg-gradient-to-r from-chart-4/20 to-chart-4/5 border-chart-4/20 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-chart-4/20 text-chart-4 flex items-center justify-center">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Progress</p>
              <p className="text-2xl font-bold font-serif text-foreground">{unlockedCount} <span className="text-muted-foreground text-sm font-sans font-normal">/ {totalCount} unlocked</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : achievements?.length === 0 ? (
        <div className="text-center pt-10 text-muted-foreground">No achievements available.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {achievements?.map((achievement) => (
            <Card 
              key={achievement.id} 
              className={cn(
                "overflow-hidden transition-all duration-300 relative group",
                achievement.unlocked ? "border-primary/30 shadow-md bg-card" : "border-dashed bg-muted/20 opacity-70 grayscale-[0.5]"
              )}
            >
              {achievement.unlocked && (
                <div className="absolute -right-6 -top-6 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
              )}
              <CardContent className="p-4 flex flex-col items-center text-center h-full justify-between">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner",
                  achievement.unlocked ? "bg-primary/10" : "bg-muted"
                )}>
                  {achievement.unlocked ? achievement.icon : <Lock size={20} className="text-muted-foreground" />}
                </div>
                
                <div>
                  <h3 className="font-bold text-sm leading-tight mb-1 text-foreground">{achievement.title}</h3>
                  <p className="text-[10px] text-muted-foreground leading-snug">{achievement.description}</p>
                </div>

                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="mt-3 text-[9px] font-medium text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-full w-full">
                    {format(new Date(achievement.unlockedAt), "MMM d, yyyy")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}