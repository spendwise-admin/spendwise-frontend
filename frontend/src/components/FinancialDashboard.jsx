import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/api";

export default function FinancialDashboard({ onBack, onAddExpense }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [visibleReceiptId, setVisibleReceiptId] = useState(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${ API_BASE }/api/expenses/reports`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const expenseDate = new Date(date);

    // Calculate difference in milliseconds
    const diffInMs = now - expenseDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return expenseDate.toLocaleDateString();
  };

  const handleEditBudget = () => {
    setNewBudget(dashboardData?.summary?.monthlyBudget || "");
    setIsEditingBudget(true);
  };

  const handleSaveBudget = async () => {
    if (!newBudget || newBudget <= 0) {
      alert("Please enter a valid budget amount");
      return;
    }

    setSavingBudget(true);
    try {
      const token = localStorage.getItem("token");
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12
      const year = now.getFullYear();

      const response = await fetch(
        `${ API_BASE }/api/expenses/budget`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            budget: parseFloat(newBudget),
            month,
            year,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update budget");
      }

      // Update local state
      setDashboardData((prev) => ({
        ...prev,
        summary: {
          ...prev.summary,
          monthlyBudget: parseFloat(newBudget),
        },
      }));

      setIsEditingBudget(false);
      alert("Budget updated successfully!");
    } catch (err) {
      console.error("Error updating budget:", err);
      alert("Failed to update budget. Please try again.");
    } finally {
      setSavingBudget(false);
    }
  };

  const handleCancelBudget = () => {
    setIsEditingBudget(false);
    setNewBudget("");
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    setDeletingExpenseId(expenseId);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${ API_BASE }/api/expenses/${expenseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      // Refresh dashboard data after deletion
      await fetchDashboardData();
      alert("Expense deleted successfully!");
    } catch (err) {
      console.error("Error deleting expense:", err);
      alert("Failed to delete expense. Please try again.");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const getMonthName = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const now = new Date();
    return months[now.getMonth()];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b46c1] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">Error loading dashboard: {error}</p>
          <button
            onClick={onBack}
            className="bg-[#6b46c1] text-white px-6 py-2 rounded-lg hover:bg-[#5a3aa8] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const {
    totalSpent = 0,
    todayTotal = 0,
    categoryData = [],
    recentExpenses = [],
    summary = {},
    budgetAlert = null,
  } = dashboardData || {};

  const { monthlyBudget = 20000, usedBudget = totalSpent } = summary;
  const budgetPercentage =
    monthlyBudget > 0 ? ((usedBudget / monthlyBudget) * 100).toFixed(1) : 0;

  const highestCategory =
    categoryData.length > 0
      ? {
          name: categoryData[0].name,
          amount: categoryData[0].amount,
          icon: categoryData[0].icon,
          color: categoryData[0].color,
        }
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#6b46c1] shadow-lg">
        <div className="max-w-sm mx-auto lg:max-w-6xl px-6 py-6 lg:py-8">
          <div className="flex items-center gap-4 text-white">
            <button
              onClick={onBack}
              className="text-white hover:text-white/80 transition-opacity"
            >
              <svg
                className="w-6 h-6 lg:w-7 lg:h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-xl lg:text-3xl font-semibold">Dashboard</h1>
          </div>
          <p className="text-white/80 text-sm lg:text-base mt-2 ml-10 lg:ml-11">
            Your financial overview
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-sm mx-auto lg:max-w-6xl px-6 py-6 lg:py-8">
        {/* Budget Alert - Show at top if exists */}
        {budgetAlert && (
          <div
            className={`mb-6 lg:mb-8 rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border-2 animate-pulse ${
              budgetAlert.type === "danger"
                ? "bg-red-50 border-red-300"
                : budgetAlert.type === "warning"
                ? "bg-yellow-50 border-yellow-300"
                : "bg-blue-50 border-blue-300"
            }`}
          >
            <div className="flex items-start gap-3 lg:gap-4">
              <div
                className={`flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center ${
                  budgetAlert.type === "danger"
                    ? "bg-red-100"
                    : budgetAlert.type === "warning"
                    ? "bg-yellow-100"
                    : "bg-blue-100"
                }`}
              >
                <span className="text-xl lg:text-2xl">
                  {budgetAlert.type === "danger"
                    ? "🚨"
                    : budgetAlert.type === "warning"
                    ? "⚠️"
                    : "💡"}
                </span>
              </div>
              <div className="flex-1">
                <h4
                  className={`font-semibold text-base lg:text-lg mb-1 ${
                    budgetAlert.type === "danger"
                      ? "text-red-800"
                      : budgetAlert.type === "warning"
                      ? "text-yellow-800"
                      : "text-blue-800"
                  }`}
                >
                  {budgetAlert.type === "danger"
                    ? "Budget Exceeded!"
                    : budgetAlert.type === "warning"
                    ? "Budget Alert!"
                    : "Budget Update"}
                </h4>
                <p
                  className={`text-sm lg:text-base ${
                    budgetAlert.type === "danger"
                      ? "text-red-700"
                      : budgetAlert.type === "warning"
                      ? "text-yellow-700"
                      : "text-blue-700"
                  }`}
                >
                  {budgetAlert.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Main Stats */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200">
                <h3 className="text-gray-600 text-sm lg:text-base mb-2">
                  Total Today
                </h3>
                <p className="text-2xl lg:text-4xl font-bold text-gray-900">
                  ₹{todayTotal}
                </p>
              </div>
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200">
                <h3 className="text-gray-600 text-sm lg:text-base mb-2">
                  This Month
                </h3>
                <p className="text-2xl lg:text-4xl font-bold text-gray-900">
                  ₹{totalSpent.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Highest Category */}
            {highestCategory ? (
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200">
                <h3 className="text-gray-800 font-semibold text-lg lg:text-xl mb-4">
                  Highest Category
                </h3>
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 lg:w-12 lg:h-12 ${highestCategory.color} rounded-lg flex items-center justify-center`}
                  >
                    <span className="text-white text-lg lg:text-xl">
                      {highestCategory.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 lg:text-lg">
                      {highestCategory.name}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 text-lg lg:text-xl">
                    {highestCategory.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200">
                <h3 className="text-gray-800 font-semibold text-lg lg:text-xl mb-4">
                  Highest Category
                </h3>
                <p className="text-gray-500 text-center py-4">
                  No expenses yet
                </p>
              </div>
            )}

            {/* Monthly Budget */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-800 font-semibold text-lg lg:text-xl">
                  Monthly Budget - {getMonthName()}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm lg:text-base text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {budgetPercentage}%
                  </span>
                  {!isEditingBudget && (
                    <button
                      onClick={handleEditBudget}
                      className="text-[#6b46c1] hover:text-[#5a3aa8] transition-colors p-1"
                      title="Edit Budget"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {isEditingBudget ? (
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-2">
                    Enter Budget Amount
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      placeholder="Enter budget"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b46c1]"
                      disabled={savingBudget}
                    />
                    <button
                      onClick={handleSaveBudget}
                      disabled={savingBudget}
                      className="bg-[#6b46c1] text-white px-4 py-2 rounded-lg hover:bg-[#5a3aa8] transition-colors disabled:opacity-50"
                    >
                      {savingBudget ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancelBudget}
                      disabled={savingBudget}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <div className="flex justify-between text-sm lg:text-base text-gray-600 mb-2">
                    <span>
                      ₹{usedBudget.toLocaleString()} of ₹
                      {monthlyBudget.toLocaleString()} used
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 lg:h-4">
                    <div
                      className={`${
                        budgetPercentage > 100
                          ? "bg-red-500"
                          : budgetPercentage > 80
                          ? "bg-yellow-500"
                          : "bg-[#6b46c1]"
                      } h-3 lg:h-4 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                    ></div>
                  </div>
                  {budgetPercentage > 100 && (
                    <p className="text-red-500 text-sm mt-2">
                      ⚠️ Budget exceeded by ₹
                      {(usedBudget - monthlyBudget).toLocaleString()}
                    </p>
                  )}
                  {budgetPercentage > 80 && budgetPercentage <= 100 && (
                    <p className="text-yellow-600 text-sm mt-2">
                      ⚠️ You've used {budgetPercentage}% of your budget
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Top Categories */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200">
              <h3 className="text-gray-800 font-semibold text-lg lg:text-xl mb-4">
                Top Categories
              </h3>
              {recentExpenses.length > 0 ? (
                <div className="space-y-3 lg:space-y-4">
                  {recentExpenses.slice(0, 5).map((expense, index) => (
                    <div key={expense.id} className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 lg:w-12 lg:h-12 ${expense.color} rounded-lg flex items-center justify-center`}
                      >
                        <span className="text-white text-lg lg:text-xl">
                          {expense.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 lg:text-lg">
                          {expense.name}
                        </p>
                        <p className="text-gray-500 text-sm lg:text-base">
                          {expense.category} • {formatTimeAgo(expense.date)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 lg:text-lg">
                        ₹{expense.amount.toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        disabled={deletingExpenseId === expense.id}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 disabled:opacity-50"
                        title="Delete expense"
                      >
                        {deletingExpenseId === expense.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No expenses yet
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200">
              <h3 className="text-gray-800 font-semibold text-lg lg:text-xl mb-4 lg:mb-6">
                Recent Activity
              </h3>
              {recentExpenses.length > 0 ? (
                <div className="space-y-4 lg:space-y-5">
                  {(showAllTransactions ? recentExpenses : recentExpenses.slice(0, 5)).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-start gap-3 lg:gap-4"
                    >
                      <div
                        className={`w-8 h-8 lg:w-10 lg:h-10 ${expense.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-white text-sm lg:text-base">
                          {expense.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm lg:text-base truncate">
                          {expense.name}
                        </p>
                        <p className="text-gray-500 text-xs lg:text-sm">
                          {expense.category} • {formatTimeAgo(expense.date)}
                        </p>

                        {/* Receipt Button*/}
                         {expense.receipt && (
      <button
        onClick={() =>
          setVisibleReceiptId(
            visibleReceiptId === expense.id ? null : expense.id
          )
        }
        className="mt-1 text-xs text-gray-500 hover:text-[#6b46c1] transition-colors"
      >
        👁 {visibleReceiptId === expense.id ? "Hide Receipt" : "View Receipt"}
      </button>
    )}

    {/* Receipt Preview */}
    {expense.receipt && visibleReceiptId === expense.id && (
      <img
        src={`${ API_BASE }${expense.receipt}`}
        alt="Receipt"
        className="mt-2 w-40 rounded-lg border border-gray-200 shadow-sm"
      />
    )}
                      </div>
                      <p className="font-semibold text-sm lg:text-base text-red-600">
                        -₹{expense.amount.toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        disabled={deletingExpenseId === expense.id}
                        className="text-red-500 hover:text-red-700 transition-colors p-1 disabled:opacity-50 flex-shrink-0"
                        title="Delete expense"
                      >
                        {deletingExpenseId === expense.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <svg
                            className="w-4 h-4 lg:w-5 lg:h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent activity
                </p>
              )}

              <div className="mt-6 lg:mt-8">
                <button 
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="w-full text-[#6b46c1] hover:text-[#5a3aa8] text-sm lg:text-base font-medium py-2 transition-colors">
                 {showAllTransactions ? "Show less ↑" : "View all →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
