import { Router, type IRouter } from "express";

const router: IRouter = Router();

const financeLessons = [
  {
    id: 1,
    title: "Pay Yourself First",
    content: "Before paying any bill or buying anything, set aside your savings amount. Treat it like a non-negotiable expense. Most people save what is left over — winners save first and spend what is left. Even saving 10% of your allowance every month builds a powerful foundation.",
    category: "habit",
    source: "Robert Kiyosaki — Rich Dad Poor Dad",
    order: 1,
  },
  {
    id: 2,
    title: "Assets vs. Liabilities",
    content: "An asset puts money in your pocket. A liability takes money out. Your phone is not an asset — it costs you money every month. A skill that earns you freelance income is an asset. Build assets, minimize liabilities. Most students spend on things that make them poorer without realizing it.",
    category: "mindset",
    source: "Robert Kiyosaki — Rich Dad Poor Dad",
    order: 2,
  },
  {
    id: 3,
    title: "The 50-30-20 Rule for Students",
    content: "Divide your monthly allowance: 50% for needs (food, transport, study), 30% for wants (personal, entertainment), and 20% for savings. In Bangladesh, you can start with just 10-15% savings and gradually increase. The discipline of dividing is more important than the exact percentages.",
    category: "budgeting",
    source: "Financial Literacy Research — OECD 2023",
    order: 3,
  },
  {
    id: 4,
    title: "The Emergency Fund",
    content: "Before saving for big goals, save at least one month's expenses as your emergency buffer. This protects you from unexpected costs — medical, transport breakdown, or family needs. Without an emergency fund, one surprise expense destroys months of discipline.",
    category: "savings",
    source: "Dave Ramsey — Financial Peace",
    order: 4,
  },
  {
    id: 5,
    title: "Track Every Taka",
    content: "You cannot manage what you do not measure. Research shows that people who track expenses spend 15-20% less without any other changes. For one month, write down every single purchase. The awareness alone changes behavior. This app is your tracking partner.",
    category: "habit",
    source: "Behavioral Finance Research — Thaler & Sunstein",
    order: 5,
  },
  {
    id: 6,
    title: "Avoid Lifestyle Inflation",
    content: "When your income increases — part-time work, stipend, scholarship — resist the urge to immediately upgrade your spending. This trap is called lifestyle inflation. Instead, direct 50% of any income increase to savings or investment. The gap between income and expenses is where wealth is built.",
    category: "mindset",
    source: "Napoleon Hill — Think and Grow Rich",
    order: 6,
  },
  {
    id: 7,
    title: "The Power of Compound Growth",
    content: "Tk 500 invested monthly from age 20 at 10% annual growth becomes Tk 30 lakh by age 40. The same amount started at 30 becomes only Tk 10 lakh. Time is the most powerful force in finance. You cannot get these early years back. Start small, start now.",
    category: "investment",
    source: "Warren Buffett on Compound Interest",
    order: 7,
  },
  {
    id: 8,
    title: "Good Debt vs. Bad Debt",
    content: "Good debt is taken for assets that grow: education, business investment, skill development. Bad debt is taken for things that lose value: clothes, phones, entertainment. As a student in Bangladesh, education is your highest-return investment. Avoid consumer debt entirely.",
    category: "debt",
    source: "Robert Kiyosaki — Cashflow Quadrant",
    order: 8,
  },
  {
    id: 9,
    title: "Build Skills, Not Just Savings",
    content: "As a student, your earning potential is your biggest asset. Every taka invested in a marketable skill — programming, English, design, data analysis — can return 10x. Balance saving money with investing in yourself. The highest-yield investment in your 20s is skill development.",
    category: "investment",
    source: "David Aaker — Building Strong Brands (adapted for personal finance)",
    order: 9,
  },
  {
    id: 10,
    title: "Set SMART Financial Goals",
    content: "Vague goals fail. 'Save money' is not a goal. 'Save Tk 10,000 in 6 months for a laptop by cutting food spending by Tk 500/month' is a SMART goal — Specific, Measurable, Achievable, Relevant, Time-bound. Write your goals down. Research shows written goals are 42% more likely to be achieved.",
    category: "goals",
    source: "Psychology Research — Dominican University Goal-Setting Study",
    order: 10,
  },
];

const ceoLessons = [
  {
    id: 1,
    title: "First-Principles Thinking",
    content: "Elon Musk breaks every problem down to its most basic truths, then builds up from there. He asked: why do batteries cost so much? Not because of the market price — but because of the raw materials. By sourcing materials directly, he cut costs 10x. Apply this to your finances: question every assumption. Why do I spend this much on food? Is that assumption actually true?",
    category: "thinking",
    source: "Elon Musk — Interview with Kevin Rose, 2012",
    order: 1,
  },
  {
    id: 2,
    title: "Discipline Is Your Superpower",
    content: "Jensen Huang of NVIDIA spent 30 years building the company before it became the most valuable semiconductor firm in the world. He maintained extreme focus and discipline through decades of setbacks. As a student, your daily discipline with small habits — studying, saving, tracking — is building the foundation of your future empire.",
    category: "discipline",
    source: "Jensen Huang — NVIDIA Keynote Speeches",
    order: 2,
  },
  {
    id: 3,
    title: "Move Fast and Learn Faster",
    content: "Mark Zuckerberg's early motto was 'move fast and break things'. The real lesson: ship fast, learn from real users, iterate. As a student entrepreneur, your biggest enemy is overthinking. Build a small version, test it with real people, improve it. The time you spend planning instead of doing is your competitor's advantage.",
    category: "execution",
    source: "Mark Zuckerberg — Facebook's Early Culture",
    order: 3,
  },
  {
    id: 4,
    title: "Customer Obsession Over Everything",
    content: "Jeff Bezos built Amazon on one principle: start with the customer and work backwards. Before every new feature, his team writes a press release from the customer's perspective. As a future founder, every product decision should start with: 'What problem does this solve for the customer?' Revenue follows value creation.",
    category: "product",
    source: "Jeff Bezos — Amazon Annual Shareholder Letters",
    order: 4,
  },
  {
    id: 5,
    title: "Embrace Failure as Data",
    content: "Sara Blakely, founder of Spanx, grew up with a father who asked 'what did you fail at this week?' Failure was celebrated as evidence of trying. Every startup failure is a dataset. Every financial mistake is a lesson. Write down what went wrong, what you learned, and what you will do differently. That discipline is rare and valuable.",
    category: "resilience",
    source: "Sara Blakely — How I Built This Podcast",
    order: 5,
  },
  {
    id: 6,
    title: "The 1% Better Every Day Rule",
    content: "1% improvement every day compounds to 37x better in a year. 1% worse every day compounds to nearly zero. James Clear calls this the aggregation of marginal gains. Track one financial habit: your daily spending. Improve it by 1% each week. Over a year, your financial discipline will be unrecognizable.",
    category: "habit",
    source: "James Clear — Atomic Habits",
    order: 6,
  },
  {
    id: 7,
    title: "Build Your Network Before You Need It",
    content: "Every successful founder credits their network. Reid Hoffman (LinkedIn) says 'your network is your net worth'. As a student in Bangladesh, join startup communities, attend events, connect with seniors. Help people without expecting immediate return. The relationships you build today are the investors, co-founders, and customers of tomorrow.",
    category: "networking",
    source: "Reid Hoffman — The Start-Up of You",
    order: 7,
  },
  {
    id: 8,
    title: "Long-Term Thinking Is Your Moat",
    content: "Short-term thinking is everywhere. It is the default. Bezos was willing to lose money for 7 years to build Amazon's long-term position. You are 20 years old with 40 productive years ahead. Every sacrifice you make now — saving instead of spending, studying instead of scrolling — is building a moat that competitors cannot copy.",
    category: "vision",
    source: "Jeff Bezos — re:Invent Conference 2016",
    order: 8,
  },
  {
    id: 9,
    title: "Solve a Real Problem in Bangladesh",
    content: "The biggest unicorn opportunities are hiding in plain sight. Bangladesh has 170 million people, growing internet penetration, a booming garments industry, and a young population. What problem do you experience every day as a student that millions of others also face? That frustration is a billion-taka business waiting to be built.",
    category: "opportunity",
    source: "Paul Graham — How to Get Startup Ideas (Y Combinator)",
    order: 9,
  },
  {
    id: 10,
    title: "Control Your Attention Like Capital",
    content: "Your attention is your most valuable resource as a student. Every hour on social media is an hour not spent on a skill, a side project, or learning. Elon Musk reads for hours daily. Jensen Huang spends deep time in technical work. Treat your time and attention like investment capital — where you put it determines your return.",
    category: "focus",
    source: "Cal Newport — Deep Work",
    order: 10,
  },
];

// Financial literacy lessons
router.get("/lessons/finance", async (_req, res): Promise<void> => {
  res.json(financeLessons);
});

// CEO / Unicorn mindset lessons
router.get("/lessons/ceo", async (_req, res): Promise<void> => {
  res.json(ceoLessons);
});

export default router;
