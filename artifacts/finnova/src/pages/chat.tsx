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

// ── Banglish / Bangla detection helper ──────────────────────────────────────
// Returns true if the input looks like Banglish or Bangla script
function isBanglish(text: string): boolean {
  const banglishMarkers = [
    "ami", "tumi", "apni", "amar", "tomar", "apnar", "amra", "amader",
    "valo", "bhalo", "kemon", "achi", "acho", "achen", "thaki", "thako",
    "ki", "kি", "keno", "kothay", "kothai", "kotha", "bhai", "vai", "apu",
    "taka", "kharch", "khoroch", "khabar", "khawa", "khabo", "khacchi",
    "bachai", "bachao", "joma", "jomai", "shuru", "hobe", "korbo", "korchi",
    "porashona", "pora", "pori", "porchi", "boi", "dhar", "bipad",
    "jaoa", "asha", "jawa", "awa", "ricksha", "riksha",
    "lagche", "lagchhe", "mone", "mon", "vabi", "bhabi",
  ];
  const lower = text.toLowerCase();
  return banglishMarkers.some((w) => lower.includes(w));
}

// Returns true if text contains Bangla unicode characters
function hasBanglaScript(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

// Friendly acknowledgment prefix when Banglish/Bangla is detected
function banglishPrefix(text: string): string {
  if (hasBanglaScript(text)) return "বুঝতে পেরেছি! 😊 এখানে তোমার জন্য পরামর্শ:\n\n";
  if (isBanglish(text)) return "Bujhte perechi! 😊 Ekhane tomar jonno advice:\n\n";
  return "";
}

const rules: Rule[] = [
  // ── Greeting ────────────────────────────────────────────────────────────
  {
    keywords: [
      // English
      "hello", "hi", "hey", "salaam", "assalamu", "start", "help",
      // Banglish
      "ami valo", "ami bhalo", "kemon acho", "kemon achen", "ki korbo", "ki hobe",
      "help koro", "help chai", "shuru kori", "shuru korbo", "ki bolbe", "bol",
      "valo achi", "bhalo achi", "ache", "achi", "ki news", "ki hocche",
      // Bangla script
      "আমি ভালো", "কেমন আছো", "কেমন আছেন", "সালাম", "শুরু", "সাহায্য",
    ],
    response: () =>
      `Assalamu Alaikum! 👋 Ami tomar FinNova Advisor — tomar personal money mentor.\n\nAmi help korte pari:\n• 💰 Allowance budget korte (টাকা ভাগ করা)\n• 📉 Overspending band korte (বেশি খরচ কমানো)\n• 🏦 Savings habit banate (টাকা জমানো)\n• 🚀 Founder mindset develop korte\n\nBanglish, Bangla ba English — ja comfortable lagbe taite likhte paro! Ki janbo?`,
  },

  // ── Allowance Planning ───────────────────────────────────────────────────
  {
    keywords: [
      // English
      "allowance", "monthly money", "pocket money", "income",
      // Banglish
      "taka pai", "taka pelam", "maser taka", "mas er taka", "koto taka pai",
      "mase koto", "taka manage", "taka kothay jai", "taka koi jai",
      "pocket e taka", "baper taka", "mayer taka", "baba dey", "ma dey",
      // Bangla script
      "টাকা", "মাসের টাকা", "পকেট মানি", "আয়", "ভাতা", "টাকা পাই",
    ],
    response: (ctx) => {
      const base = ctx.totalAllowance
        ? `Tomar monthly allowance holo **${formatBDT(ctx.totalAllowance)}**. Eita smartly use koro eivabe:`
        : `Ekhane ekta smart way diye dechi tomar monthly allowance divide korte:`;
      return `${base}\n\n📊 **50-30-20 Student Rule (সহজ নিয়ম):**\n• 50% → Needs — khabar, transport, pora (দরকারি খরচ)\n• 30% → Wants — personal, fun (ইচ্ছার খরচ)\n• 20% → Savings — must! (সঞ্চয়, বাধ্যতামূলক)\n\n**Practical steps:**\n1. Masher shuru te takai kagoje vag kore felo\n2. 20% savings tukey niye alag bKash/bank e rakho immediately\n3. Baki taka theke kharch koro — ulta na\n\n💡 Akhon choto discipline = pore boro freedom!`;
    },
  },

  // ── Budgeting ────────────────────────────────────────────────────────────
  {
    keywords: [
      // English
      "budget", "plan", "divide", "split", "category", "distribute",
      // Banglish
      "kharch plan", "khoroch plan", "plan kori", "vag kori", "vaag kori",
      "kivabe manage", "kemon vabe", "ki kore", "taka vag", "taka manage kori",
      "budget banabo", "budget kori", "budget korbo",
      // Bangla script
      "বাজেট", "পরিকল্পনা", "ভাগ করা", "খরচ পরিকল্পনা", "বাজেট করব",
    ],
    response: (ctx) => {
      if (ctx.totalAllowance) {
        const food = Math.round(ctx.totalAllowance * 0.3);
        const transport = Math.round(ctx.totalAllowance * 0.15);
        const savings = Math.round(ctx.totalAllowance * 0.2);
        const study = Math.round(ctx.totalAllowance * 0.1);
        const personal = Math.round(ctx.totalAllowance * 0.25);
        return `Tomar **${formatBDT(ctx.totalAllowance)}** allowance er jonno suggested budget:\n\n🍛 Khabar (Food) — ${formatBDT(food)} (30%)\n🚌 Jaatayat (Transport) — ${formatBDT(transport)} (15%)\n📚 Pora (Study) — ${formatBDT(study)} (10%)\n🎯 Personal — ${formatBDT(personal)} (25%)\n💰 Savings (জমানো) — ${formatBDT(savings)} (20%)\n\nBudget tab e giye eita set kore nao. Mool kotha: **aage bachai, tarpor kharch.**`;
      }
      return `Ekta good student budget eivabe kaj kore:\n\n🍛 Khabar — 30%\n🚌 Transport — 15%\n📚 Pora — 10%\n🎯 Personal — 25%\n💰 Savings — 20%\n\n**Mool niyom (মূল নিয়ম):** Aage savings tule rako, tarpor baki taka theke kharch koro. Ei ekta habit tomar jibon paltiye debe.\n\nBudget tab e giye tomar nijo number set kore nao!`;
    },
  },

  // ── Overspending / Wasteful ──────────────────────────────────────────────
  {
    keywords: [
      // English
      "overspend", "waste", "spend too much", "money gone", "broke", "no money",
      // Banglish
      "beshi kharch", "beshi khoroch", "taka shesh", "shesh hoye gese",
      "shesh hoye jay", "taka nei", "taka nai", "kharchchi beshi",
      "taka ure jay", "taka jai", "kharchi", "taka kothay jay",
      "mas shesh er age taka shesh", "maas shes hoy",
      // Bangla script
      "বেশি খরচ", "টাকা শেষ", "টাকা নেই", "অপচয়", "শেষ হয়ে গেছে",
      "খরচ", "শেষ", "টাকা উড়ে যায়",
    ],
    response: (ctx) => {
      const prefix =
        ctx.budgetUtilization && ctx.budgetUtilization > 80
          ? `Dekha jacche tumi budget er **${ctx.budgetUtilization}%** use kore feleche — ei warning sign ta seriously nao! Kivabe thaman:`
          : `Beshi kharch kora student life er sabcheye boro problem. Eivabe thaman:`;
      return `${prefix}\n\n**5 টি উপায় overspending বন্ধ করতে:**\n1. **Food delivery app delete koro** — canteen ba ghore ranna karo\n2. **24-hour rule mano** — ৳200 er beshi kichu kinle 1 din wait koro\n3. **Daily limit set koro** — example: max ৳300/day\n4. **Protidin kharch log koro** — awareness e 20% waste kome jay\n5. **Kam cash niye bero** — sudhu je taka lagbe seta nao\n\n🔑 Beshi kharch mostly emotional, logical na. Kinbar age ek baar pause koro!`;
    },
  },

  // ── Saving Money ─────────────────────────────────────────────────────────
  {
    keywords: [
      // English
      "save", "saving", "savings", "invest", "future", "store money",
      // Banglish
      "bachai", "bachao", "bachabo", "joma", "jomao", "jomabo", "jomai",
      "taka jomabo", "taka bachabo", "taka rakhi", "taka rakhbo",
      "joma debo", "jomiye rakhi", "savings korbo", "invest korbo",
      // Bangla script
      "জমানো", "বাঁচাই", "সঞ্চয়", "ভবিষ্যৎ", "টাকা জমাব", "বাঁচাব",
      "টাকা রাখব", "সঞ্চয় করব",
    ],
    response: (ctx) => {
      const savingsAmt = ctx.totalAllowance ? Math.round(ctx.totalAllowance * 0.2) : null;
      return `Student life e taka bachanoi sabcheye boro habit. Eivabe shuru koro:\n\n**Step-by-step savings plan:**\n1. **Aage nijer jonno bachao** — ${savingsAmt ? `${formatBDT(savingsAmt)}` : "otochu 20%"} pawa matrei alag kore rako\n2. **Alag account kholo** — bKash savings, Dutch-Bangla, ba jokono bank\n3. **Kabhu hath dio na** — ei taka bill er moto treat koro\n4. **Goal er jonno bachao** — Goals tab e target set koro (phone, laptop, emergency)\n\n**Quick calculation:** Sudhu ৳500/month bachale = ৳6,000/year. Ekta laptop fund!\n\n🚀 Warren Buffett 11 bochor boyese invest shuru korechen. Tumi aaj shuru korte paro.`;
    },
  },

  // ── Emergency Fund ───────────────────────────────────────────────────────
  {
    keywords: [
      // English
      "emergency", "backup", "rainy day", "unexpected", "sudden", "crisis",
      // Banglish
      "bipad", "achanak", "achat", "problem hole", "bipoter taka",
      "emergency fund", "emergency taka", "reserve", "backup taka",
      "sudden khoroch", "unexpected khoroch",
      // Bangla script
      "জরুরি", "বিপদ", "হঠাৎ", "সংকট", "জরুরি তহবিল",
    ],
    response: () =>
      `Emergency fund mane holo unexpected situation er jonno rakha taka — doctor bill, phone repair, travel emergency.\n\n**Student hisebe kivabe banabo:**\n1. Target set koro: 1-2 maser khoroch (usually ৳5,000–৳15,000)\n2. Protimase fixed amount save koro jotokkhon target hit na koro\n3. Alag rako — bKash ba savings account e, wallet e na\n4. Sudhu real emergency te use koro\n\n**Keno dorkar (কেন দরকার):** Emergency fund chara ekta bipad tomar puro financial plan noshto kore dite pare.\n\n💡 Sudhu ৳500/month diye shuru koro. 1 bochore ৳6,000 hobei!`,
  },

  // ── Food Spending ────────────────────────────────────────────────────────
  {
    keywords: [
      // English
      "food", "eat", "lunch", "dinner", "restaurant", "canteen",
      // Banglish
      "khabar", "khawa", "khabo", "khacchi", "khai", "bhat", "tarkari",
      "khite", "breakfast", "mess", "hotel e khai", "baire khai",
      "khabar e beshi", "khabar khoroch", "food e beshi", "food delivery",
      "hungri naki", "bhukhha",
      // Bangla script
      "খাবার", "খাওয়া", "ভাত", "খাবো", "খাচ্ছি", "খাই", "তরকারি",
      "খাবারে বেশি", "খাবার খরচ",
    ],
    response: (ctx) => {
      const foodTip = ctx.topCategory === "food"
        ? `Ei maase tomar sabcheye beshi khoroch hocche khabare. Eita control kora dorkar! `
        : ``;
      return `${foodTip}Khabar e student der sabcheye beshi taka jay. Eivabe control koro:\n\n**Smart khabar habits:**\n• Campus canteen e khao — restaurant er cheye 50–70% sosta\n• Ghore simple ranna koro saptahe 3–4 din (dal-bhat-dim = ৳40–60)\n• Food delivery app avoid koro — delivery fee ই ৳50–150 extra\n• Water bottle niye bero — drink kinar cost add up kore\n• Daily food budget set koro (example: max ৳150/day)\n\n**Quick math:** Saptahe ekta restaurant meal skip = ৳400–800/month bachai.\n\n🍛 Smart khawa mane ki'pur hoa na — strategic hoa!`;
    },
  },

  // ── Transport ────────────────────────────────────────────────────────────
  {
    keywords: [
      // English
      "transport", "rickshaw", "bus", "cng", "ride", "uber", "pathao", "travel",
      // Banglish
      "riksha", "ricksha", "jaoa", "asha", "jawa", "awa", "jaite",
      "asite", "jaatayat", "bus e jaoa", "cng te jaoa", "pathao te jaoa",
      "uber te jaoa", "transport khoroch", "jaatayat khoroch",
      // Bangla script
      "যাতায়াত", "রিকশা", "বাস", "ভ্রমণ", "যাওয়া", "আসা",
    ],
    response: () =>
      `Jaatayat e chupchap onek taka chale jay. Eivabe cut koro:\n\n**Smart jaatayat habits:**\n• Jotota possible public bus use koro — CNG/ricksha er cheye 5–10x sosta\n• 1.5 km er kom hole hatao — taka bache + healthy thako\n• Daily commute e Pathao/Uber avoid koro — sudhu emergency te\n• Bondhu der sathe share koro CNG/ricksha cost\n• Din plan kore bero — unnecessary trip avoid korbe\n\n**Target:** Allowance er 15% er beshi jaatayate kharchio na.\n\n💡 Je student ricksha er badle protdin 2km hate — tar ৳1,500–2,000/month bache!`,
  },

  // ── Study Spending ───────────────────────────────────────────────────────
  {
    keywords: [
      // English
      "study", "book", "course", "tuition", "photocopy", "notes",
      // Banglish
      "pora", "porashona", "pori", "porchi", "boi", "class", "notes",
      "photocopy", "shikhbo", "shikha", "sikha", "tuition", "private",
      "pora kharch", "boi kini", "boi er daam",
      // Bangla script
      "পড়াশোনা", "পড়ি", "বই", "ক্লাস", "নোটস", "শিখব", "টিউশন",
    ],
    response: () =>
      `Education e invest kora sabcheye boro investment. Kintu smart e pora + kam taka kharch kora possible:\n\n**Study spending tips:**\n• Classmate der sathe boi share koro, sudhu dorkar ta photocopy karo\n• Free resources use koro: YouTube, Coursera (audit free), Khan Academy\n• Study group banao — 4 jon miliye photocopy korle cost 25% hoy\n• Seniors er kach theke second-hand boi kino — 50–70% sosta\n• Semester er shuru te study budget plan koro, pore react na kore\n\n**Mindset:** Porashonar pichone kharch kora taka 10x return diye ashbe career e.\n\n📚 Shobcheye successful founders obsessive learner. Pora chario na!`,
  },

  // ── Phone / Entertainment ────────────────────────────────────────────────
  {
    keywords: [
      // English
      "phone", "mobile", "recharge", "internet", "data", "entertainment",
      "game", "netflix", "youtube", "social media",
      // Banglish
      "recharge", "data kini", "mb kini", "internet", "scroll",
      "fb", "facebook", "tiktok", "insta", "instagram",
      "game kheli", "game khelchi", "social media te", "phone e time",
      "mobile e beshi", "phone khoroch",
      // Bangla script
      "ফোন", "মোবাইল", "রিচার্জ", "ইন্টারনেট", "গেম", "সোশ্যাল মিডিয়া",
    ],
    response: () =>
      `Phone ar entertainment e taka chupchap ure jay. Eivabe control koro:\n\n**Smart digital khoroch:**\n• Grameenphone/Banglalink student pack use koro — regular recharge er cheye boro value\n• Monthly data budget set koro ar mano koro\n• Heavy download er jonno campus WiFi use koro\n• Streaming subscription bondhu der sathe share koro\n• Daily screen time limit set koro — kam scroll = beshi productivity\n\n**1% rule:** Kono monthly subscription jodi tomar allowance er 1% er beshi hoy, dui bar chintao.\n\n📱 Tomar phone hok learning ar earning er tool — shudhu consuming er na.`,
  },

  // ── Debt / Borrowing ─────────────────────────────────────────────────────
  {
    keywords: [
      // English
      "debt", "loan", "borrow", "owe", "credit",
      // Banglish
      "dhar", "dhar nebo", "dhar niyechi", "dhar korchi", "loan nebo",
      "taka dharo", "bondhu r kache nibo", "manush er kache taka",
      "karo kache taka cheyechi", "kistu", "kisti",
      // Bangla script
      "ধার", "ঋণ", "ধার নেব", "ধার করেছি", "কিস্তি",
      "নেওয়া", "কারো কাছে টাকা",
    ],
    response: () =>
      `Student hisebe dhar newa ekta serious warning sign. Shottyi kotha:\n\n**Dhar niye kotha (ধার সম্পর্কে):**\n• Wants er jonno kabhu dhar nio na — shudhu genuine emergency te\n• Bondhu der kache dhar avoid koro — relationship noshto hoy\n• Student loan thakle, unnecessary khoroch er age seta pay off koro\n• High-interest loan kabhu nio na — interest compound hoy, boro bipod\n\n**Jodi already dhar e thako:**\n1. Shob non-essential khoroch ekhuni bando koro\n2. Repayment plan banao — protimase fixed amount deo\n3. Ekjon trusted family member ke jano — accountability dorkar\n\n⚠️ Dhar financially disciplined manusheet jonno tool — poor planning er safety net na.`,
  },

  // ── Financial Literacy ───────────────────────────────────────────────────
  {
    keywords: [
      // English
      "financial literacy", "learn finance", "money basics",
      "assets", "liabilities", "inflation", "compound", "interest",
      // Banglish
      "finance sikhbo", "finance jante chai", "money shikhbo",
      "asset kake bole", "liability kake bole", "compound interest ki",
      "inflation ki", "financial knowledge", "taka niye jante chai",
      "financial basics", "money er niyom",
      // Bangla script
      "আর্থিক সাক্ষরতা", "ফাইন্যান্স শিখব", "সম্পদ", "দায়",
      "চক্রবৃদ্ধি", "মুদ্রাস্ফীতি",
    ],
    response: () =>
      `Financial literacy tomar sabcheye valuable skill. Ei core concepts gulo shobai jana dorkar:\n\n**Money Basics (টাকার মূল নিয়ম):**\n• **Asset** = ja tomar pocket e taka ANE (savings, skills, choto business)\n• **Liability** = ja tomar pocket theke taka NIYE JAY (loan, impulse buy)\n• **Compound interest** = interest er upor interest — taka exponentially bare\n• **Inflation** = taka r value time er sathe kome — idle cash e rkha mane loss\n\n**3 ti boi ja tomar money mindset paltabe:**\n1. Rich Dad Poor Dad — Robert Kiyosaki\n2. The Psychology of Money — Morgan Housel\n3. The Richest Man in Babylon — George Clason\n\n📖 Protdin 10 page pora = mase 1 ta life-changing boi!`,
  },

  // ── Startup Mindset ──────────────────────────────────────────────────────
  {
    keywords: [
      // English
      "startup", "business", "entrepreneur", "ceo", "founder",
      "unicorn", "company", "idea", "build",
      // Banglish
      "business korbo", "business shuru", "startup korbo",
      "nijo business", "kaj shuru", "ceo hobo", "ceo hote chai",
      "founder hobo", "company banabo", "idea ache", "nijo kaj",
      "freelance", "income korbo", "earn korbo",
      // Bangla script
      "ব্যবসা", "উদ্যোক্তা", "স্টার্টআপ", "ব্যবসা করব",
      "সিইও", "প্রতিষ্ঠাতা", "আইডিয়া আছে",
    ],
    response: () =>
      `Startup mindset build kora shuru hoy EKHONI — graduation er por na! Future founder hisebe eivabe vabo:\n\n**CEO Habits aaj theke shuru koro:**\n1. **Shobi track koro** — CEO ra tader number jane. Income, khoroch, savings — shob\n2. **Value te vabo** — "ami ki problem solve korchi?" — kinbar age ba kichhu banano age jiggesh koro\n3. **Fast shekho** — protdin tomar cheye smart manush er kotha shono, poro, dekho\n4. **Uncomfortable thako** — discipline ekhon = freedom pore\n5. **Choto theke shuru koro** — Elon Musk, Steve Jobs, Jensen Huang shobai choto problem diye shuru korechen\n\n**Bangladesh e student founder ideas:**\n• Social media te tutoring service\n• Facebook e product buy-resell\n• Upwork/Fiverr e freelancing tomar skill diye\n\n🚀 Student life e startup mindset build korar best time — rent nai, risk kam!`,
  },

  // ── Discipline / Habits ──────────────────────────────────────────────────
  {
    keywords: [
      // English
      "discipline", "habit", "consistent", "routine",
      "self control", "willpower", "motivation", "lazy",
      // Banglish
      "discipline nai", "habit banabo", "routine", "niyomito",
      "alosh", "aalosh", "lazy lage", "motivation nai",
      "ektu ektu", "consistent thakbo", "nijeke control",
      "will power", "control korte parchhi na",
      // Bangla script
      "শৃঙ্খলা", "অভ্যাস", "নিয়মিত", "অলস", "মোটিভেশন নেই",
      "নিজেকে নিয়ন্ত্রণ",
    ],
    response: () =>
      `Financial discipline ekta muscle — choto choto daily action diye build hoy.\n\n**Ei shoptahe 5 ti habit shuru koro:**\n1. **Protdin expense log koro** — ৳10 ricksha bhara o. Awareness = control\n2. **Protibar Robibar budget review koro** — 10 minute, shoptahe ekbar\n3. **"Ek Shoptah Rule" use koro** — boro kichu kinbar age 7 din wait koro\n4. **Choto win celebrate koro** — ৳500 bachale? Seta ekta win!\n5. **Accountability partner khojo** — ekjon bondhu ke tomar goal jano\n\n**Mone rekho:** Tomar perfect willpower lagbe na. Lagbe smart system.\n\n💪 Protdin 1% better = bochor e 37x better. Aaj theke shuru!`,
  },

  // ── Goals / Targets ──────────────────────────────────────────────────────
  {
    keywords: [
      // English
      "goal", "target", "dream", "buy", "laptop", "trip",
      // Banglish
      "goal set", "target set", "kinbo", "laptop kinbo", "phone kinbo",
      "trip debo", "ghurte jabo", "lakkho", "lakkhyo", "swapno",
      "ki kinbo", "taka jomabo ki er jonno", "goal ache",
      // Bangla script
      "লক্ষ্য", "স্বপ্ন", "কিনব", "ল্যাপটপ কিনব", "ফোন কিনব",
      "টার্গেট", "ঘুরতে যাব",
    ],
    response: () =>
      `Ekta clear goal thakle savings automatic hoy. Eivabe set koro ar hit koro:\n\n**SMART Goal Framework (ছাত্রছাত্রীদের জন্য):**\n• **Specific** — "Laptop er jonno ৳15,000 bachabo" (na shudhu "taka bachabo")\n• **Measurable** — shoptahe progress track koro\n• **Achievable** — tomar real allowance er upor based\n• **Time-bound** — "6 mashe"\n\n**Action steps:**\n1. Goals tab e giye target amount ar deadline diye goal add koro\n2. Monthly savings calculate koro (target ÷ mash)\n3. Pawar sathe sathe alag account e transfer set up koro\n\n**Example:** ৳15,000 laptop ÷ 6 mash = mase ৳2,500 bachano lagbe.\n\n🎯 Goal chara plan sudhu ekta wish. Aaj real kore felo!`,
  },

  // ── Motivation / General ─────────────────────────────────────────────────
  {
    keywords: [
      // English
      "feel bad", "struggling", "hard", "difficult",
      "tired", "give up", "stressed", "worried",
      // Banglish
      "kosto lagche", "kosto", "tension", "dukho", "hataash",
      "mon kharap", "mon valo na", "mon bhalo na",
      "baje lagche", "valo lagche na", "bhalo lagche na",
      "give up debo", "chhere debo", "ar parchi na",
      "frustrated", "depressed lage",
      // Bangla script
      "কষ্ট লাগছে", "টেনশন", "দুঃখ", "হতাশ", "মন খারাপ",
      "মন ভালো না", "পারছি না", "ছেড়ে দেব",
    ],
    response: () =>
      `Mon kharap hoa normal — taka r tension real. Tumi eka na. Mone rekho:\n\n💬 **"হাজার মাইলের যাত্রা শুরু হয় একটি পদক্ষেপ দিয়ে।"**\n\nAaj shob fix korte hobe na. Shudhu EKTA kaj koro:\n• Aajker expense ta log koro\n• ৳100 bachao — jokono amount count kore\n• Money r upor ekta article poro\n• Budget tab e giye ekta category set koro\n\nProgress, perfection na. Shobcheye boro founders o month er por month struggle koreche breakthrough er age.\n\n🌟 Tumi ei app use korcho mane tumi already 90% students er cheye age. Theko!`,
  },
];

const QUICK_SUGGESTIONS = [
  "Allowance kivabe manage korbo?",
  "Taka bachabo kivabe?",
  "Beshi kharch hoy, ki korbo?",
  "Startup mindset niye bolun",
  "Emergency fund ki?",
  "কীভাবে বাজেট করব?",
];

const FALLBACK_RESPONSE = `Bujhte parchi naठीक thik, kintu ekhane help korte pari:\n\n💰 **টাকার বিষয় (Money topics):**\n• Budget ar allowance planning\n• Savings strategies (টাকা জমানো)\n• Overspending komanor upay\n• Khabar, transport, study khoroch\n• Emergency fund\n• Dhar management\n\n🚀 **Mindset topics:**\n• Startup & CEO habits\n• Financial discipline\n• Goal setting\n\nEivabe jiggesh karo: *"Taka bachabo kivabe?"* ba *"Khabare beshi kharch hoy."* ba **বাংলায়** লিখলেও বুঝব! 😊`;

function getResponse(input: string, ctx: AppContext): string {
  const lower = input.toLowerCase();
  const prefix = banglishPrefix(input);

  for (const rule of rules) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      const response = rule.response(ctx);
      // Don't double-prefix greeting responses (they already start friendly)
      const isGreeting = rule.keywords.includes("hello");
      return isGreeting ? response : prefix + response;
    }
  }

  // Partial intent fallback — number + taka/bdt implies allowance question
  if (/\d+/.test(input) && (lower.includes("tk") || lower.includes("taka") || lower.includes("৳") || lower.includes("bdt"))) {
    return prefix + rules.find((r) => r.keywords.includes("allowance"))!.response(ctx);
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
  text: `Assalamu Alaikum! 👋 Ami tomar FinNova Advisor.\n\n**Banglish, বাংলা, or English** — ja comfortable lagbe taite likhte paro! Ami tintoi bujhi. 😊\n\nAmi help korte pari:\n• 💰 Allowance budget korte\n• 📉 Beshi kharch komanote\n• 🏦 Taka jomano te\n• 🚀 Founder mindset banate\n\nKi janbo aaj?`,
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
