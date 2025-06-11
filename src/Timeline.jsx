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
  const [timeline, setTimeline] = useState([]);
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

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [timeline]);

  const todayStr = new Date().toDateString();

  const scrollToToday = () => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={scrollToToday}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-50"
      >
        Today
      </button>
      <div className="overflow-x-auto">
        <table className="table-fixed w-full border-collapse border border-gray-500">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="bg-gray-100">
              <th className="w-[5%] border border-gray-500 px-1 py-2 text-left">Day</th>
              <th className="w-[5%] border border-gray-500 px-1 py-2 text-left">Date</th>
              <th className="w-[15%] border border-gray-500 px-1 py-2 text-left">Balance</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((entry, index) => (
              <tr
                key={index}
                ref={entry.date.toDateString() === todayStr ? todayRef : null}
                className={`border-b border-gray-300 ${entry.date.toDateString() === todayStr ? 'bg-blue-100' : ''}`}
              >
                <td className="border border-gray-300 px-1 py-2">
                  {entry.date.toLocaleDateString('en-US', { weekday: 'long' })}
                </td>
                <td className="border border-gray-300 px-1 py-2">
                  {entry.date.toLocaleDateString('en-US')}
                </td>
                <td className="border border-gray-300 px-1 py-2">
                  ${entry.endingBalance.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
