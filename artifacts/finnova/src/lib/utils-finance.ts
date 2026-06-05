export const formatBDT = (amount: number) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    food: "🍛",
    transport: "🚌",
    savings: "💰",
    study: "📚",
    personal: "🛍️",
  };
  return icons[category.toLowerCase()] || "💸";
};

export const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    food: "hsl(var(--chart-1))",
    transport: "hsl(var(--chart-2))",
    savings: "hsl(var(--chart-3))",
    study: "hsl(var(--chart-4))",
    personal: "hsl(var(--chart-5))",
  };
  return colors[category.toLowerCase()] || "hsl(var(--primary))";
};
