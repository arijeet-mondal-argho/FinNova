import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGetDashboardSummary, useGetCategoryBreakdown } from "@workspace/api-client-react";
import { formatBDT } from "@/lib/utils-finance";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

// ─── Rule-Based Engine ───────────────────────────────────────────────────────
// To upgrade to real AI later: replace `getResponse()` with an API call
// and keep the rest of the UI exactly as-is.

type AppContext = {
  totalAllowance?: number;
  totalSpent?: number;
  totalRemaining?: number;
  budgetUtilization?: number;
  savingsRate?: number;
  topCategory?: string;
};

interface Rule {
  keywords: string[];
  response: (ctx: AppContext) => string;
}

const rules: Rule[] = [
  // ── Greeting ────────────────────────────────────────────────────────────
  {
    keywords: ["hello", "hi", "hey", "salaam", "assalamu", "hola", "start", "shuru", "help"],
    response: () =>
      `Assalamu Alaikum! 👋 I'm your FinNova Advisor — your personal money mentor.\n\nI can help you with:\n• 💰 Budgeting your allowance\n• 📉 Cutting overspending\n• 🏦 Building savings habits\n• 🚀 Developing a founder mindset\n\nWhat would you like to talk about today?`,
  },

  // ── Allowance Planning ───────────────────────────────────────────────────
  {
    keywords: ["allowance", "monthly money", "pocket money", "income", "টাকা"],
    response: (ctx) => {
      const base = ctx.totalAllowance
        ? `You currently have a monthly allowance of **${formatBDT(ctx.totalAllowance)}**. Here's how to use it wisely:`
        : `Here's a smart way to divide your monthly allowance:`;
      return `${base}\n\n📊 **The 50-30-20 Student Rule:**\n• 50% → Needs (food, transport, study)\n• 30% → Wants (personal, entertainment)\n• 20% → Savings (non-negotiable!)\n\n**Practical steps:**\n1. On the 1st of every month, divide your allowance on paper first\n2. Move your 20% savings to a separate bKash/bank account immediately\n3. Track every taka you spend using the Expenses tab\n\n💡 Small discipline now = big freedom later!`;
    },
  },

  // ── Budgeting ────────────────────────────────────────────────────────────
  {
    keywords: ["budget", "plan", "divide", "split", "category", "distribute"],
    response: (ctx) => {
      if (ctx.totalAllowance) {
        const food = Math.round(ctx.totalAllowance * 0.3);
        const transport = Math.round(ctx.totalAllowance * 0.15);
        const savings = Math.round(ctx.totalAllowance * 0.2);
        const study = Math.round(ctx.totalAllowance * 0.1);
        const personal = Math.round(ctx.totalAllowance * 0.25);
        return `Here's a suggested budget based on your **${formatBDT(ctx.totalAllowance)}** allowance:\n\n🍛 Food — ${formatBDT(food)} (30%)\n🚌 Transport — ${formatBDT(transport)} (15%)\n📚 Study — ${formatBDT(study)} (10%)\n🎯 Personal — ${formatBDT(personal)} (25%)\n💰 Savings — ${formatBDT(savings)} (20%)\n\nYou can adjust these on the Budget tab. The key is: **save first, spend what's left.**`;
      }
      return `A good student budget follows this pattern:\n\n🍛 Food — 30%\n🚌 Transport — 15%\n📚 Study — 10%\n🎯 Personal — 25%\n💰 Savings — 20%\n\n**Key rule:** Set your savings aside FIRST before spending anything. This is what separates financially disciplined students from the rest.\n\nSet your budget in the Budget tab to get personalized numbers!`;
    },
  },

  // ── Overspending / Wasteful ──────────────────────────────────────────────
  {
    keywords: ["overspend", "waste", "spend too much", "money gone", "broke", "no money", "খরচ", "শেষ", "শেষ হয়ে"],
    response: (ctx) => {
      const prefix =
        ctx.budgetUtilization && ctx.budgetUtilization > 80
          ? `I can see you've used **${ctx.budgetUtilization}%** of your budget — that's a warning sign. Here's how to fix it:`
          : `Overspending is one of the biggest student money problems. Here's how to stop it:`;
      return `${prefix}\n\n**5 ways to stop overspending:**\n1. **Delete food delivery apps** — cook or eat campus food instead\n2. **Use the 24-hour rule** — wait a day before any purchase over ৳200\n3. **Set a daily limit** — example: ৳300/day max spending\n4. **Log every expense** — awareness alone cuts 20% of waste\n5. **Carry less cash** — only take what you need for the day\n\n🔑 Most overspending is emotional, not logical. Pause before you buy!`;
    },
  },

  // ── Saving Money ─────────────────────────────────────────────────────────
  {
    keywords: ["save", "saving", "savings", "invest", "future", "store money", "জমানো"],
    response: (ctx) => {
      const savingsAmt = ctx.totalAllowance ? Math.round(ctx.totalAllowance * 0.2) : null;
      return `Saving money as a student is the best habit you can build. Here's how:\n\n**Step-by-step savings plan:**\n1. **Pay yourself first** — save ${savingsAmt ? `${formatBDT(savingsAmt)}` : "at least 20%"} the moment you get your allowance\n2. **Open a separate account** — bKash savings, Dutch-Bangla, or any bank\n3. **Never touch it** — treat savings as a bill you MUST pay\n4. **Save for a goal** — use the Goals tab to set a target (phone, laptop, emergency fund)\n\n**Quick win:** Even saving ৳500/month = ৳6,000/year. That's a laptop fund!\n\n🚀 Warren Buffett started investing at age 11. You can start saving today.`;
    },
  },

  // ── Emergency Fund ───────────────────────────────────────────────────────
  {
    keywords: ["emergency", "backup", "rainy day", "unexpected", "sudden", "crisis"],
    response: () =>
      `An emergency fund is money set aside for unexpected situations — medical bills, phone repair, travel emergencies.\n\n**How to build one as a student:**\n1. Set a target: 1-2 months of expenses (usually ৳5,000–৳15,000)\n2. Save a fixed amount each month until you hit the target\n3. Keep it separate — bKash or a savings account, NOT in your wallet\n4. Only use it for true emergencies\n\n**Why it matters:** Without an emergency fund, one bad event forces you into debt. One good habit protects your entire financial plan.\n\n💡 Start with just ৳500/month. You'll hit ৳6,000 in a year.`,
  },

  // ── Food Spending ────────────────────────────────────────────────────────
  {
    keywords: ["food", "eat", "lunch", "dinner", "restaurant", "canteen", "খাবার", "খাওয়া"],
    response: (ctx) => {
      const foodTip = ctx.topCategory === "food" ? `Food is your top spending category this month. ` : ``;
      return `${foodTip}Food is usually the biggest expense for students. Here's how to control it:\n\n**Smart food habits:**\n• Eat at the campus canteen — usually 50–70% cheaper than restaurants\n• Cook simple meals at home 3–4 days/week (dal, rice, egg = ৳40–60)\n• Avoid food delivery apps — they add ৳50–150 in delivery fees per order\n• Carry a water bottle — buying drinks adds up fast\n• Set a daily food budget (example: ৳150/day) and stick to it\n\n**Quick math:** Skipping one restaurant meal/week saves ৳400–800/month.\n\n🍛 Eating smart is not about being cheap — it's about being strategic.`;
    },
  },

  // ── Transport ────────────────────────────────────────────────────────────
  {
    keywords: ["transport", "rickshaw", "bus", "cng", "ride", "uber", "pathao", "যাতায়াত", "travel"],
    response: () =>
      `Transport can silently eat a huge chunk of your allowance. Here's how to cut it:\n\n**Smart transport habits:**\n• Use public bus whenever possible — 5–10x cheaper than CNG/rickshaw\n• Walk for distances under 1.5 km — saves money AND keeps you healthy\n• Avoid Pathao/Uber for daily commutes — use them only for emergencies\n• Group rides with friends to split CNG/rickshaw costs\n• Plan your day to avoid unnecessary trips\n\n**Target:** Keep transport under 15% of your allowance.\n\n💡 A student who walks 2km/day instead of taking a rickshaw saves ৳1,500–2,000/month.`,
  },

  // ── Study Spending ───────────────────────────────────────────────────────
  {
    keywords: ["study", "book", "course", "tuition", "photocopy", "notes", "পড়াশোনা"],
    response: () =>
      `Education is your best investment. But you can study smart AND spend less:\n\n**Study spending tips:**\n• Share textbooks with classmates and photocopy only what you need\n• Use free resources: YouTube, Coursera (audit free), Khan Academy, Google Scholar\n• Join study groups — one photocopy split 4 ways costs 25% of the price\n• Buy second-hand books from seniors — usually 50–70% cheaper\n• Budget for study costs at the start of each semester, not reactively\n\n**Mindset:** Every taka invested in learning = 10x return in your career.\n\n📚 The most successful founders are obsessive learners. Keep studying!`,
  },

  // ── Phone / Entertainment ────────────────────────────────────────────────
  {
    keywords: ["phone", "mobile", "recharge", "internet", "data", "entertainment", "game", "netflix", "youtube", "social media"],
    response: () =>
      `Phone and entertainment costs are sneaky budget killers. Here's how to control them:\n\n**Smart digital spending:**\n• Use Grameenphone/Banglalink student packs — better value than regular recharges\n• Set a monthly mobile data budget and stick to it\n• Use campus WiFi for heavy downloading\n• Share streaming subscriptions with friends\n• Set a daily screen-time limit — less scrolling = more productivity\n\n**The 1% rule:** If a monthly subscription costs more than 1% of your allowance, think twice.\n\n📱 Your phone should be a tool for learning and earning, not just consuming.`,
  },

  // ── Debt / Borrowing ─────────────────────────────────────────────────────
  {
    keywords: ["debt", "loan", "borrow", "owe", "credit", "নেওয়া", "ধার", "কিস্তি"],
    response: () =>
      `Borrowing money as a student is a serious warning sign. Here's the honest truth:\n\n**About debt:**\n• Never borrow for wants — only for genuine emergencies\n• Avoid borrowing from friends unless absolutely necessary — it damages relationships\n• If you have a student loan, prioritize paying it off before spending on non-essentials\n• Never take high-interest loans (NGO microloans, money lenders) — interest compounds fast\n\n**If you're already in debt:**\n1. Stop all non-essential spending immediately\n2. Create a repayment plan — pay a fixed amount each month\n3. Tell a trusted family member for accountability\n\n⚠️ Debt is a tool for the financially disciplined — not a safety net for poor planning.`,
  },

  // ── Financial Literacy ───────────────────────────────────────────────────
  {
    keywords: ["financial literacy", "learn finance", "money basics", "assets", "liabilities", "inflation", "compound", "interest"],
    response: () =>
      `Financial literacy is your most valuable skill. Here are the core concepts every student must know:\n\n**Money Basics:**\n• **Asset** = something that puts money IN your pocket (savings, skills, small business)\n• **Liability** = something that takes money OUT (unnecessary loans, impulse buys)\n• **Compound interest** = earning interest on your interest — money grows exponentially over time\n• **Inflation** = money loses value over time — idle cash is losing value\n\n**3 books that will change how you think about money:**\n1. Rich Dad Poor Dad — Robert Kiyosaki\n2. The Psychology of Money — Morgan Housel\n3. The Richest Man in Babylon — George Clason\n\n📖 Read 10 pages/day = 1 life-changing book per month.`,
  },

  // ── Startup Mindset ──────────────────────────────────────────────────────
  {
    keywords: ["startup", "business", "entrepreneur", "ceo", "founder", "unicorn", "company", "idea", "build"],
    response: () =>
      `Building a startup mindset starts NOW — not after graduation. Here's how to think like a future founder:\n\n**CEO Habits to build today:**\n1. **Track everything** — CEOs know their numbers. Know your income, spending, and savings every week\n2. **Think in value** — ask "what problem am I solving?" before spending or building anything\n3. **Learn fast** — read, watch, listen to people smarter than you every day\n4. **Build tolerance for discomfort** — discipline now = freedom later\n5. **Start small** — Elon Musk, Steve Jobs, Jensen Huang all started with tiny, focused problems\n\n**Student founder ideas for Bangladesh:**\n• Tutoring service on social media\n• Buying and reselling products on Facebook\n• Freelancing on Upwork/Fiverr with your skills\n\n🚀 The best time to build a startup mindset is as a student — with no rent to pay!`,
  },

  // ── Discipline / Habits ──────────────────────────────────────────────────
  {
    keywords: ["discipline", "habit", "consistent", "routine", "self control", "willpower", "motivation", "lazy"],
    response: () =>
      `Financial discipline is like a muscle — you build it with small daily actions.\n\n**5 Habits to build this week:**\n1. **Log expenses daily** — even ৳10 rickshaw fare. Awareness = control\n2. **Review your budget every Sunday** — 10 minutes, every week\n3. **Use the "One Week Rule"** — wait 7 days before any big purchase\n4. **Celebrate small wins** — saved ৳500 this week? That's a win!\n5. **Find an accountability partner** — share goals with a friend\n\n**Remember:** You don't need perfect willpower. You need smart systems.\n\n💪 One percent better every day = 37x better in a year. Start today.`,
  },

  // ── Goals / Targets ──────────────────────────────────────────────────────
  {
    keywords: ["goal", "target", "dream", "buy", "laptop", "phone", "trip", "লক্ষ্য"],
    response: () =>
      `Having a clear goal makes saving effortless. Here's how to set and hit financial goals:\n\n**SMART Goal Framework for students:**\n• **Specific** — "Save ৳15,000 for a laptop" (not just "save money")\n• **Measurable** — track weekly progress\n• **Achievable** — based on your real allowance\n• **Time-bound** — "in 6 months"\n\n**Action steps:**\n1. Add your goal in the Goals tab with a target amount and deadline\n2. Calculate your monthly savings needed (target ÷ months)\n3. Set up an automatic transfer to a separate account on payday\n\n**Example:** ৳15,000 laptop ÷ 6 months = ৳2,500/month savings needed.\n\n🎯 A goal without a plan is just a wish. Make it real today!`,
  },

  // ── Motivation / General ─────────────────────────────────────────────────
  {
    keywords: ["feel bad", "struggling", "hard", "difficult", "tired", "give up", "stressed", "worried"],
    response: () =>
      `It's okay to feel overwhelmed. Money stress is real — and you're not alone. Here's what to remember:\n\n💬 **"The journey of a thousand miles begins with a single step."**\n\nYou don't need to fix everything today. Pick ONE thing:\n• Log your expenses for just today\n• Save ৳100 — any amount counts\n• Read one article about money\n• Open the Budget tab and set one category\n\nProgress, not perfection. Every great founder had months of struggle before breakthrough.\n\n🌟 The fact that you're using this app means you're already ahead of 90% of students. Keep going!`,
  },
];

const QUICK_SUGGESTIONS = [
  "How do I budget my allowance?",
  "How to save money as a student?",
  "I keep overspending. Help!",
  "Tell me about startup mindset",
  "How to build an emergency fund?",
  "How to reduce food spending?",
];

const FALLBACK_RESPONSE = `I'm not sure I understand that fully, but here's what I can help you with:\n\n💰 **Money topics:**\n• Budgeting & allowance planning\n• Saving strategies\n• Cutting overspending\n• Food, transport, and study costs\n• Emergency fund building\n• Debt management\n\n🚀 **Mindset topics:**\n• Startup & CEO habits\n• Financial discipline\n• Goal setting\n\nTry asking something like: *"How do I save money?"* or *"I keep overspending on food."*`;

function getResponse(input: string, ctx: AppContext): string {
  const lower = input.toLowerCase();

  for (const rule of rules) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.response(ctx);
    }
  }

  // Partial intent fallback — check for numbers/amounts to give allowance advice
  if (/\d+/.test(input) && (lower.includes("tk") || lower.includes("taka") || lower.includes("৳") || lower.includes("bdt"))) {
    return rules.find((r) => r.keywords.includes("allowance"))!.response(ctx);
  }

  return FALLBACK_RESPONSE;
}

// ─── Markdown-lite renderer ──────────────────────────────────────────────────
function renderText(text: string) {
  return text.split("\n").map((line, i) => {
    const boldified = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
    );
    const italicified = boldified.flatMap((seg) =>
      typeof seg === "string"
        ? seg.split(/\*(.*?)\*/g).map((p, j) => (j % 2 === 1 ? <em key={j}>{p}</em> : p))
        : [seg]
    );
    return (
      <span key={i} className="block">
        {italicified}
      </span>
    );
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "bot",
  text: `Assalamu Alaikum! 👋 I'm your FinNova Advisor — your personal money mentor for student life in Bangladesh.\n\nAsk me anything about budgeting, saving, overspending, or building a founder mindset. I'm here to help!`,
  timestamp: new Date(),
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: summary } = useGetDashboardSummary();
  const { data: breakdown } = useGetCategoryBreakdown();

  const appCtx: AppContext = {
    totalAllowance: summary?.totalAllowance,
    totalSpent: summary?.totalSpent,
    totalRemaining: summary?.totalRemaining,
    budgetUtilization: summary?.budgetUtilization,
    savingsRate: summary?.savingsRate,
    topCategory: breakdown
      ? [...breakdown].sort((a, b) => b.spent - a.spent)[0]?.category
      : undefined,
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate a short thinking delay for natural feel
    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      const responseText = getResponse(text, appCtx);
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: "bot",
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);
  }

  function handleReset() {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
  }

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 bg-background border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">FinNova Advisor</h1>
            <p className="text-xs text-muted-foreground">Your personal money mentor</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="text-muted-foreground hover:text-foreground"
          title="Reset conversation"
        >
          <RotateCcw size={18} />
        </Button>
      </div>

      {/* Personalized context banner */}
      {summary && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 text-xs text-muted-foreground flex items-center gap-2">
          <Sparkles size={12} className="text-primary shrink-0" />
          <span>
            {format(new Date(), "MMMM")}: {formatBDT(summary.totalRemaining)} left of{" "}
            {formatBDT(summary.totalAllowance)} — {summary.budgetUtilization}% used
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                  msg.role === "bot"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {msg.role === "bot" ? <Bot size={16} /> : <User size={16} />}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-0.5",
                  msg.role === "bot"
                    ? "bg-card border border-border/50 text-foreground rounded-tl-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm"
                )}
              >
                {renderText(msg.text)}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2 items-end"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary/50"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions — shown only when few messages */}
      {messages.length <= 2 && !isTyping && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/8 border border-primary/20 text-primary hover:bg-primary/15 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 pb-[84px] border-t border-border/40 bg-background">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about money, savings, budgeting..."
            className="flex-1 px-4 py-2.5 rounded-full bg-muted text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
            disabled={isTyping}
          />
          <Button
            size="icon"
            className="rounded-full w-10 h-10 shrink-0"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Educational guidance only — not licensed financial advice
        </p>
      </div>
    </div>
  );
}
