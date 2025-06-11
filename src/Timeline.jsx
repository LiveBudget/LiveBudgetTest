
import { useState, useEffect, useRef } from "react";

function generateForecast(startDate, endDate, startingBalance, recurringItems, minBalance, cycleType) {
  const days = [];
  const cashFlows = {};

  const getOccurrences = (item) => {
    let date = new Date(item.next_date);
    const occurrences = [];
    while (date <= endDate) {
      occurrences.push(new Date(date));
      date.setDate(date.getDate() + item.frequency_days);
    }
    return occurrences;
  };

  for (const item of recurringItems) {
    for (const date of getOccurrences(item)) {
      const key = date.toDateString();
      if (!cashFlows[key]) cashFlows[key] = [];
      cashFlows[key].push({ ...item });
    }
  }

  let currentBalance = startingBalance;
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toDateString();
    const entries = cashFlows[dateStr] || [];
    let netChange = 0;
    const transactions = [];

    for (const item of entries) {
      if (!item.is_savings_goal) {
        const type = item.amount > 0 ? "income" : (item.name.toLowerCase().includes("transfer") ? "transfer" : "expense");
        netChange += item.amount;
        transactions.push({ description: item.name, amount: item.amount, type });
      }
    }

    currentBalance += netChange;

    for (const item of entries) {
      if (item.is_savings_goal) {
        const originalAmount = Math.abs(item.amount);
        const maxTransfer = Math.max(0, currentBalance - minBalance);
        const adjustedAmount = -Math.min(originalAmount, maxTransfer);
        currentBalance += adjustedAmount;
        const reduction = originalAmount - Math.abs(adjustedAmount);
        transactions.push({
          description: reduction > 0
            ? `${item.name} (adjusted from $${originalAmount} to $${Math.abs(adjustedAmount)})`
            : item.name,
          amount: adjustedAmount,
          type: "savings"
        });
      }
    }

    days.push({
      date: new Date(d),
      endingBalance: currentBalance,
      netChange,
      transactions,
      isActual: false
    });
  }

  return days.reverse();
}

export default function Timeline() {
  const [expanded, setExpanded] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [showOnlyWithActivity, setShowOnlyWithActivity] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ income: true, expense: true, transfer: true, savings: true });
  const todayRef = useRef(null);

  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setFullYear(today.getFullYear() - 2);
    const end = new Date(today);
    end.setFullYear(today.getFullYear() + 5);

    const recurringItems = [
      {
        name: "Paycheck",
        amount: 2000,
        frequency_days: 14,
        next_date: new Date(2025, 5, 7),
        is_savings_goal: false
      },
      {
        name: "Mortgage",
        amount: -2500,
        frequency_days: 30,
        next_date: new Date(2025, 5, 5),
        is_savings_goal: false
      },
      {
        name: "Emergency Fund",
        amount: -500,
        frequency_days: 30,
        next_date: new Date(2025, 5, 10),
        is_savings_goal: true
      }
    ];

    const forecast = generateForecast(start, end, 4000, recurringItems, 800, "monthly");
    setTimeline(forecast);
  }, []);

  const toggleExpand = (index) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const todayStr = new Date().toDateString();

  const scrollToToday = () => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleFilter = (type) => {
    setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="relative p-4 space-y-2">
      <div className="mb-4 space-y-2">
        <label className="text-sm font-medium block">
          <input
            type="checkbox"
            checked={showOnlyWithActivity}
            onChange={() => setShowOnlyWithActivity(prev => !prev)}
            className="mr-2"
          />
          Show only days with activity
        </label>
        <div className="flex flex-wrap gap-4 text-sm">
          {['income', 'expense', 'transfer', 'savings'].map((type) => (
            <label key={type} className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={activeFilters[type]}
                onChange={() => toggleFilter(type)}
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>
      <button
        onClick={scrollToToday}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-50"
      >
        Today
      </button>
      {timeline
        .filter(entry => !showOnlyWithActivity || entry.transactions.length > 0)
        .map((entry, index) => (
          <div
            key={index}
            ref={entry.date.toDateString() === todayStr ? todayRef : null}
            className={`border rounded-md p-4 cursor-pointer shadow-sm ${entry.date.toDateString() === todayStr ? 'border-blue-500 border-2' : ''}`}
            onClick={() => toggleExpand(index)}
          >
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold">{entry.date.toDateString()}</span>
              <span className="text-right font-mono">${entry.endingBalance.toLocaleString()}</span>
            </div>
            {expanded[index] && (
              <div className="pt-2 space-y-1">
                {entry.transactions
                  .filter(txn => activeFilters[txn.type])
                  .map((txn, i) => (
                    <p
                      key={i}
                      className={`text-sm ${
                        txn.type === "income" ? "text-green-600" :
                        txn.type === "expense" ? "text-red-600" :
                        txn.type === "transfer" ? "text-blue-600" :
                        txn.type === "savings" ? "text-purple-600" : ""
                      }`}
                    >
                      {txn.description}: ${txn.amount.toLocaleString()}
                    </p>
                  ))}
                <textarea
                  placeholder="Add a note for this date..."
                  className="mt-2 w-full border border-gray-300 rounded-md p-1 text-sm"
                ></textarea>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
