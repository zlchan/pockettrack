export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const groupExpensesByDate = <T extends { date: string }>(
  expenses: T[]
): { date: string; data: T[] }[] => {
  const grouped = expenses.reduce((acc, expense) => {
    const dateKey = new Date(expense.date).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(expense);
    return acc;
  }, {} as Record<string, T[]>);

  return Object.entries(grouped)
    .map(([date, data]) => ({
      date: new Date(date).toISOString(),
      data: data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)}`;
};

export const getNextOccurrence = (
  recurrenceType: string,
  startDate: string,
  lastGenerated?: string
): Date | null => {
  const now = new Date();
  const start = new Date(startDate);
  const last = lastGenerated ? new Date(lastGenerated) : new Date(start.getTime() - 1);

  let nextDate = new Date(last);

  switch (recurrenceType) {
    case 'daily':
      nextDate.setDate(last.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(last.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(last.getMonth() + 1);
      break;
    default:
      return null;
  }

  // If next occurrence is before start date, use start date
  if (nextDate < start) {
    return start;
  }

  return nextDate;
};