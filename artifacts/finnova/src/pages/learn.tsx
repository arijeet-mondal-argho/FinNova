import { useState } from "react";
import { useListFinanceLessons, useListCeoLessons, getListFinanceLessonsQueryKey, getListCeoLessonsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BookOpen, Lightbulb, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Learn() {
  const [activeTab, setActiveTab] = useState("finance");
  
  const { data: financeLessons, isLoading: isLoadingFinance } = useListFinanceLessons({
    query: { queryKey: getListFinanceLessonsQueryKey() }
  });

  const { data: ceoLessons, isLoading: isLoadingCeo } = useListCeoLessons({
    query: { queryKey: getListCeoLessonsQueryKey() }
  });

  const renderLessons = (lessons: any[], isLoading: boolean, type: "finance" | "ceo") => {
    if (isLoading) {
      return (
        <div className="space-y-4 pt-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      );
    }

    if (!lessons || lessons.length === 0) {
      return <div className="text-center py-10 text-muted-foreground">No content available.</div>;
    }

    return (
      <div className="space-y-4 pt-4 pb-20">
        <AnimatePresence mode="popLayout">
          {lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden border-border/50 shadow-md">
                <div className={`h-2 w-full ${type === 'finance' ? 'bg-primary' : 'bg-chart-2'}`} />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="secondary" className={`${type === 'finance' ? 'bg-primary/10 text-primary' : 'bg-chart-2/10 text-chart-2'}`}>
                      {type === 'finance' ? <BookOpen size={12} className="mr-1" /> : <Rocket size={12} className="mr-1" />}
                      Lesson {index + 1}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-xl mb-2 leading-tight">{lesson.title}</h3>
                  <div className="text-muted-foreground text-sm leading-relaxed prose prose-sm dark:prose-invert" 
                       dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }} />
                  
                  {lesson.source && (
                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Source / Read More</span>
                      <a href={lesson.source} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4 min-h-screen bg-background flex flex-col">
      <div className="flex flex-col mb-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Lightbulb className="text-chart-4" /> Daily Growth
        </h1>
        <p className="text-sm text-muted-foreground">Level up your money and mind.</p>
      </div>

      <Tabs defaultValue="finance" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="finance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Financial Literacy
          </TabsTrigger>
          <TabsTrigger value="ceo" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-chart-2 data-[state=active]:shadow-sm">
            CEO Mindset
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="finance" className="flex-1 mt-0 outline-none">
          <ScrollArea className="h-full pr-3 -mr-3">
            {renderLessons(financeLessons || [], isLoadingFinance, "finance")}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="ceo" className="flex-1 mt-0 outline-none">
          <ScrollArea className="h-full pr-3 -mr-3">
            {renderLessons(ceoLessons || [], isLoadingCeo, "ceo")}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}