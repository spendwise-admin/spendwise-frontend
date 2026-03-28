import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import AddExpense from "./AddExpense";
import FinancialDashboard from "./FinancialDashboard";
import Reports from "./Reports";
import { API_BASE } from "../config/api";

export default function Dashboard() {
  const { logout, user } = useAuth();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showFinancialDashboard, setShowFinancialDashboard] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    expenses: [],
    totalAmount: 0,
    transactionCount: 0,
    loading: true,
    error: null,
  });
  const [visibleReceiptId, setVisibleReceiptId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setDashboardData((prev) => ({ ...prev, loading: true, error: null }));
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Fetch recent expenses
      const expensesResponse = await fetch(
        `${ API_BASE }/api/expenses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!expensesResponse.ok) {
        throw new Error("Failed to fetch expenses");
      }

      const expenses = await expensesResponse.json();

      // Fetch dashboard reports for summary data
      const reportsResponse = await fetch(
        `${ API_BASE }/api/expenses/reports`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!reportsResponse.ok) {
        throw new Error("Failed to fetch reports");
      }

      const reports = await reportsResponse.json();

      // Category mapping for icons and colors
      const categoryMapping = {
        food: { icon: "🍽️", color: "bg-cyan-400" },
        transport: { icon: "🚗", color: "bg-orange-400" },
        shopping: { icon: "�️", color: "bg-yellow-400" },
        utilities: { icon: "⚡", color: "bg-blue-400" },
        entertainment: { icon: "🎭", color: "bg-purple-400" },
        other: { icon: "💰", color: "bg-gray-400" },
      };

      // Format expenses for dashboard display (top 3 categories)
      const formattedExpenses = (reports.recentExpenses || [])
        .slice(0, 3)
        .map((expense, index) => {
         const categoryMapping = {
         Food: { icon: "🍽️", color: "bg-cyan-400" },
         Transport: { icon: "🚗", color: "bg-orange-400" },
         Shopping: { icon: "🛍️", color: "bg-yellow-400" },
         Utilities: { icon: "⚡", color: "bg-blue-400" },
         Entertainment: { icon: "🎭", color: "bg-purple-400" },
         Other: { icon: "💰", color: "bg-gray-400" },
       };
          const categoryInfo =
            categoryMapping[expense.category] ||
            categoryMapping.Other;

           return {
      id: expense.id,
      category: expense.name,
      amount: expense.amount,
      perPersonAmount: expense.perPersonAmount,
      splitCount: expense.splitCount,
      splits: expense.splits || [],
      receipt: expense.receipt,
      icon: expense.icon || categoryInfo.icon,
      color: categoryInfo.color,
      progress: "w-full",
    };
  });

      setDashboardData({
        expenses: formattedExpenses,
        totalAmount: reports.totalSpent || 0,
        transactionCount: expenses.length,
        budgetAlert: reports.budgetAlert || null,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setDashboardData((prev) => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
    }
  };

  const handleAddExpense = () => {
    setShowAddExpense(true);
  };

  const handleBackFromAddExpense = () => {
    setShowAddExpense(false);
  };

  const handleDashboardClick = () => {
    setShowFinancialDashboard(true);
  };

  const handleBackFromFinancialDashboard = () => {
    setShowFinancialDashboard(false);
  };

  const handleReportsClick = () => {
    setShowReports(true);
  };

  const handleBackFromReports = () => {
    setShowReports(false);
  };

  const handleSaveExpense = async (formData) => {
    try{
      const token = localStorage.getItem("token");

      const response = await fetch(`${ API_BASE }/api/expenses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save expense");
      }

      const result = await response.json();
      console.log("Expense saved successfully:", result);

      // Refresh dashboard data after saving
      await fetchDashboardData();
      // Go back to dashboard
      setShowAddExpense(false);

    } catch (error) {
      console.error("Error saving expense:", error);
      // You might want to show an error message to the user here
      alert("Error saving expense: " + error.message);
    }
  };

  // Show Reports component if showReports is true
  if (showReports) {
    return <Reports onBack={handleBackFromReports} />;
  }

  // Show FinancialDashboard component if showFinancialDashboard is true
  if (showFinancialDashboard) {
    return (
      <FinancialDashboard
        onBack={handleBackFromFinancialDashboard}
        onAddExpense={handleAddExpense}
      />
    );
  }

  // Show AddExpense component if showAddExpense is true
  if (showAddExpense) {
    return (
      <AddExpense
        onBack={handleBackFromAddExpense}
        onSave={handleSaveExpense}
      />
    );
  }

  // Show loading state
  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b46c1] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (dashboardData.error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">
            Error loading dashboard: {dashboardData.error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="bg-[#6b46c1] text-white px-6 py-2 rounded-lg hover:bg-[#5a3aa8] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-[#6b46c1] to-[#8b5cf6] px-6 pt-12 pb-8 text-white">
        <div className="max-w-sm mx-auto lg:max-w-4xl">
          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Spend Wise</h1>
              <p className="text-white/80">Personal Finance Tracker</p>
            </div>
            <button
              onClick={logout}
              className="text-white bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg border border-white/30 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Greeting */}
          <div className="flex justify-between items-center mb-2 lg:mb-4">
            <h1 className="text-2xl lg:text-4xl font-normal">
              Hello, {user?.email || "User"}! 👋
            </h1>
            <button
              onClick={logout}
              className="lg:hidden text-white/80 hover:text-white text-sm px-3 py-1 rounded-lg border border-white/30"
            >
              Logout
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-white/90 text-lg lg:text-xl mb-8">
            Here's your spending overview
          </p>

          {/* Total Expense Card */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 text-gray-800 shadow-lg">
            <p className="text-gray-500 text-sm lg:text-base mb-1">
              Total Expenses This Month
            </p>
            <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-1">
              ₹{dashboardData.totalAmount.toLocaleString()}
            </h2>
            <p className="text-gray-500 text-sm lg:text-base">
              {dashboardData.transactionCount} transactions
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-sm mx-auto lg:max-w-6xl px-6 -mt-4">
        {/* Budget Alert Banner */}
        {dashboardData.budgetAlert && (
          <div
            className={`mb-6 rounded-xl lg:rounded-2xl p-4 lg:p-5 shadow-lg border-2 ${
              dashboardData.budgetAlert.type === "danger"
                ? "bg-red-50 border-red-400 animate-bounce"
                : dashboardData.budgetAlert.type === "warning"
                ? "bg-yellow-50 border-yellow-400 animate-pulse"
                : "bg-blue-50 border-blue-300"
            }`}
          >
            <div className="flex items-center gap-3 lg:gap-4">
              <div
                className={`flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center ${
                  dashboardData.budgetAlert.type === "danger"
                    ? "bg-red-100"
                    : dashboardData.budgetAlert.type === "warning"
                    ? "bg-yellow-100"
                    : "bg-blue-100"
                }`}
              >
                <span className="text-2xl lg:text-3xl">
                  {dashboardData.budgetAlert.type === "danger"
                    ? "🚨"
                    : dashboardData.budgetAlert.type === "warning"
                    ? "⚠️"
                    : "💡"}
                </span>
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold text-base lg:text-lg ${
                    dashboardData.budgetAlert.type === "danger"
                      ? "text-red-800"
                      : dashboardData.budgetAlert.type === "warning"
                      ? "text-yellow-800"
                      : "text-blue-800"
                  }`}
                >
                  {dashboardData.budgetAlert.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Button */}
        <div className="mb-8 lg:flex lg:justify-center">
          <button
            onClick={handleAddExpense}
            className="w-full lg:w-auto lg:min-w-[300px] bg-[#6b46c1] hover:bg-[#5b3ba3] text-white py-4 px-6 rounded-2xl font-medium text-lg flex items-center justify-center gap-2 shadow-lg transition-colors"
          >
            <span className="text-xl">+</span>
            Add Expense
          </button>
        </div>

        {/* Desktop Layout */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Dashboard & Reports Buttons - Left Side Centered */}
          <div className="lg:col-span-1 lg:flex lg:flex-col lg:justify-center lg:items-center">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6 mb-8 lg:w-full lg:max-w-sm">
              <button
                onClick={handleDashboardClick}
                className="bg-white p-4 lg:p-10 rounded-xl lg:rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center hover:shadow-lg transition-shadow lg:min-h-[200px]"
              >
                <div className="text-2xl lg:text-6xl mb-2 lg:mb-4">📊</div>
                <span className="font-medium text-gray-800 lg:text-2xl lg:mb-2">
                  Dashboard
                </span>
                <span className="text-xs lg:text-base text-gray-500 lg:text-center">
                  View detailed insights
                </span>
              </button>
              <button
                onClick={handleReportsClick}
                className="bg-white p-4 lg:p-10 rounded-xl lg:rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center hover:shadow-lg transition-shadow lg:min-h-[200px]"
              >
                <div className="text-2xl lg:text-6xl mb-2 lg:mb-4">📈</div>
                <span className="font-medium text-gray-800 lg:text-2xl lg:mb-2">
                  Reports
                </span>
                <span className="text-xs lg:text-base text-gray-500 lg:text-center">
                  Spending analysis
                </span>
              </button>
            </div>
          </div>

          {/* Recent Spending Section - Right Side */}
          <div className="lg:col-span-2 mb-8">
            <h3 className="text-lg lg:text-2xl font-medium text-gray-800 mb-4 lg:mb-8">
              Recent Spending
            </h3>

            <div className="space-y-4 lg:space-y-6">
              {dashboardData.expenses.length > 0 ? (
                dashboardData.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="bg-white rounded-xl p-4 lg:p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3 lg:mb-6">
                      <div className="flex items-start gap-3 lg:gap-6">
                        <div
                          className={`w-10 h-10 lg:w-16 lg:h-16 ${expense.color} rounded-full flex items-center justify-center`}
                        >
                          <span className="text-white text-lg lg:text-2xl">
                            {expense.icon}
                          </span>
                        </div>
                        <div className="flex flex-col">
                        <p className="font-medium text-gray-800 lg:text-xl">
                          {expense.category}
                        </p>
                        {expense.splitCount > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                     Split {expense.splitCount} • ₹
                     {Math.round(expense.perPersonAmount).toLocaleString()} / person
                     </p>
                    )}

                    
                      </div>
                      </div>
                      
                      <div className="text-right">
                     <p className="font-semibold text-gray-900 lg:text-xl">
                      ₹{expense.amount.toLocaleString()}
                     </p>
                    {expense.receipt && (
  <button
    onClick={() =>
      setVisibleReceiptId(
        visibleReceiptId === expense.id ? null : expense.id
      )
    }
    className="mt-1 flex items-center gap-2 text-xs text-gray-500 hover:text-[#6b46c1] transition-colors duration-200"
  >
    👁 {visibleReceiptId === expense.id ? "Hide Receipt" : "View Receipt"}
  </button>
)}
{expense.receipt && visibleReceiptId === expense.id && (
  <img
    src={`${ API_BASE }${expense.receipt}`}
    alt="Receipt"
className="mt-3 w-44 rounded-xl border border-gray-200 shadow-sm object-contain"  />
)}

                    </div>
                    </div>

                    {expense.splitCount > 1 ? (

  <div className="mt-5 space-y-3 w-full overflow-hidden">

    {expense.splits.map((person, index) => {
      const percent = (person.amount / expense.amount) * 100;

      return (
        <div key={index} className="w-full">

          <div className="flex justify-between text-sm text-gray-700">
            <span>{person.name}</span>
            <span>₹{person.amount}</span>
          </div>

          <div className="bg-gray-200 rounded-full h-2 mt-1 w-full">
            <div
              className={`${expense.color} h-2 rounded-full`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>

        </div>
      );
    })}

  </div>

) : (

  <div className="mt-4">
    <div className="bg-gray-200 rounded-full h-1 w-full">
      <div className={`${expense.color} h-2 rounded-full w-full`}></div>
    </div>
  </div>

)}

                   

                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                  <div className="text-gray-400 text-4xl mb-4">📊</div>
                  <p className="text-gray-600 text-lg mb-2">No expenses yet</p>
                  <p className="text-gray-500">
                    Start by adding your first expense!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Navigation Indicator - Only on mobile */}
        <div className="flex justify-center pb-8 lg:hidden">
          <div className="w-32 h-1 bg-gray-800 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
