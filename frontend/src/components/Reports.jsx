import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

import { API_BASE } from "../config/api";


export default function Reports({ onBack }) {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [specificDate, setSpecificDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [animateBars, setAnimateBars] = useState(false);

  const isMobile = () => {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

  useEffect(() => {
    setAnimateBars(false);

  const timer = setTimeout(() => {
    setAnimateBars(true);
  }, 100);

  return () => clearTimeout(timer);
}, [reportData]);
const generateFileName = (extension) => {
  const now = new Date();

  const formatDate = (date) =>
    new Date(date)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "_");

  if (selectedFilter === "today") {
    return `SpendWise_Report_${formatDate(now)}.${extension}`;
  }

  if (selectedFilter === "week") {
    return `SpendWise_Weekly_Report_${formatDate(now)}.${extension}`;
  }

  if (selectedFilter === "month") {
    const month = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear();
    return `SpendWise_Report_${month}_${year}.${extension}`;
  }

  if (selectedFilter === "date" && specificDate) {
    return `SpendWise_Report_${formatDate(specificDate)}.${extension}`;
  }

  if (selectedFilter === "custom" && customStartDate && customEndDate) {
    return `SpendWise_Report_${formatDate(
      customStartDate
    )}_to_${formatDate(customEndDate)}.${extension}`;
  }

  return `SpendWise_Report_${formatDate(now)}.${extension}`;
};

const handleExportPDF = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  let queryParams = "";

  if (selectedFilter === "custom" && customStartDate && customEndDate) {
    queryParams = `?filter=custom&startDate=${customStartDate}&endDate=${customEndDate}`;
  } 
  else if (selectedFilter === "date" && specificDate) {
    queryParams = `?date=${specificDate}`;
  } 
  else if (selectedFilter !== "all") {
    queryParams = `?filter=${selectedFilter}`;
  }

  const response = await fetch(
    `${API_BASE}/api/expenses/reports${queryParams}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await response.json();

  const doc = new jsPDF("p", "mm", "a4", true);

  let currentY = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SPENDWISE EXPENSE STATEMENT", 105, currentY, { align: "center" });

  currentY += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(
    `Generated On: ${new Date().toLocaleString()}`,
    105,
    currentY,
    { align: "center" }
  );

  currentY += 6;

  doc.text(
    `Filter: ${getFilterLabel()}`,
    105,
    currentY,
    { align: "center" }
  );

  currentY += 12;

  const rows =
    data.recentExpenses?.map((exp) => [
      new Date(exp.date).toISOString().split("T")[0],
      exp.name,
      exp.category,
      `Rs ${exp.amount.toLocaleString("en-IN")}`,
    ]) || [];

  autoTable(doc, {
    startY: currentY,
    head: [["Date", "Description", "Category", "Amount"]],
    body: rows,
    theme: "striped",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [107, 70, 193] },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text(
    `Total Spent: Rs ${data.totalSpent.toLocaleString("en-IN")}`,
    14,
    currentY
  );

const fileName = (generateFileName("pdf"));
if (isMobile()) {
  const blob = doc.output("blob");
  saveAs(blob, fileName);
} else {
  doc.save(fileName);
}
};
  
const handleExportExcel = () => {
  if (!reportData) {
    alert("No report data to export");
    return;
  }

  const {
    totalSpent = 0,
    categoryData = [],
    summary = {},
  } = reportData;

  const wb = XLSX.utils.book_new();

  // ===== SHEET 1: SUMMARY =====
  const summaryData = [
    ["SpendWise Financial Summary"],
    [],
    ["Generated On", new Date().toLocaleDateString()],
    ["Filter Used", getFilterLabel()],
    ["Total Spent", totalSpent],
    [
      "Budget Used",
      summary.monthlyBudget
        ? summary.usedBudget / summary.monthlyBudget
        : 0,
    ],
    ["Highest Category", summary.highestCategory || "None"],
    ["Lowest Category", summary.lowestCategory || "None"],
    ["Total Categories", summary.totalCategories || 0],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
ws1["A1"].s = {
  font: { bold: true, sz: 14 },
  alignment: { horizontal: "center", vertical: "center" },
};
  ws1["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

  ws1["!cols"] = [
    { wch: 25 },
    { wch: 20 },
  ];

  // Format numbers
  if (ws1["B5"]) ws1["B5"].z = "₹#,##0";
  if (ws1["B6"]) ws1["B6"].z = "0%";

  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  // ===== SHEET 2: CATEGORY DETAILS =====
  const categoryTable = [
    ["Category", "Amount (₹)", "Percentage (%)"],
  ];

  categoryData.forEach((cat) => {
    categoryTable.push([
      cat.name,
      cat.amount,
      cat.percentage / 100,
    ]);
  });

  categoryTable.push(["TOTAL", totalSpent, 1]);

  const ws2 = XLSX.utils.aoa_to_sheet(categoryTable);

  ws2["!cols"] = [
    { wch: 25 },
    { wch: 18 },
    { wch: 18 },
  ];

  const range = XLSX.utils.decode_range(ws2["!ref"]);

  for (let R = 1; R <= range.e.r; ++R) {
    if (ws2[`B${R + 1}`]) ws2[`B${R + 1}`].z = "₹#,##0";
    if (ws2[`C${R + 1}`]) ws2[`C${R + 1}`].z = "0%";
  }

  XLSX.utils.book_append_sheet(wb, ws2, "Category Breakdown");

  const fileName = generateFileName("xlsx");

if (isMobile()) {
  const excelBuffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, fileName);
} else {
  XLSX.writeFile(wb, fileName);
}
};
  

  useEffect(() => {
    fetchReportData();
  }, [selectedFilter, customStartDate, customEndDate, specificDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Build query parameters
      let queryParams = "";
      if (selectedFilter === "custom" && customStartDate && customEndDate) {
        queryParams = `?filter=custom&startDate=${customStartDate}&endDate=${customEndDate}`;
      } else if (selectedFilter === "date" && specificDate) {
        queryParams = `?date=${specificDate}`;
      } else if (selectedFilter !== "all") {
        queryParams = `?filter=${selectedFilter}`;
      }

      const response = await fetch(
        `${API_BASE}/api/expenses/reports${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch report data");
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const expenseDate = new Date(date);
    const diffInHours = Math.floor((now - expenseDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return expenseDate.toLocaleDateString();
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    if (filter !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
    if (filter !== "date") {
      setSpecificDate("");
    }
    setShowDatePicker(filter === "date" || filter === "custom");
  };

  const getFilterLabel = () => {
    switch (selectedFilter) {
      case "today":
        return "Today's";
      case "week":
        return "This Week's";
      case "month":
        return "This Month's";
      case "custom":
        return customStartDate && customEndDate
          ? `${new Date(customStartDate).toLocaleDateString()} - ${new Date(
              customEndDate
            ).toLocaleDateString()}`
          : "Custom Range";
      case "date":
        return specificDate
          ? new Date(specificDate).toLocaleDateString()
          : "Select Date";
      default:
        return "All Time";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b46c1] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">Error loading reports: {error}</p>
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
    categoryData = [],
    insights = [],
    summary = {},
    budgetAlert = null,
  } = reportData || {};

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
            <h1 className="text-xl lg:text-3xl font-semibold">Reports</h1>
          </div>
          <p className="text-white/80 text-sm lg:text-base mt-2 ml-10 lg:ml-11">
            {getFilterLabel()} Spending Analysis
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-sm mx-auto lg:max-w-6xl px-6 py-4">
          <div className="flex flex-wrap gap-2 lg:gap-3 mb-3">
            <button
              onClick={() => handleFilterChange("today")}
              className={`px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
                selectedFilter === "today"
                  ? "bg-[#6b46c1] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleFilterChange("week")}
              className={`px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
                selectedFilter === "week"
                  ? "bg-[#6b46c1] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handleFilterChange("month")}
              className={`px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
                selectedFilter === "month"
                  ? "bg-[#6b46c1] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleFilterChange("date")}
              className={`px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
                selectedFilter === "date"
                  ? "bg-[#6b46c1] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📅 Pick Date
            </button>
            <button
              onClick={() => handleFilterChange("custom")}
              className={`px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
                selectedFilter === "custom"
                  ? "bg-[#6b46c1] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📆 Custom Range
            </button>

            <button
  onClick={handleExportExcel}
  className="px-4 py-2 rounded-lg text-sm lg:text-base font-medium bg-green-600 text-white hover:bg-green-700 transition-colors touch-manipulation"
>
  📊 Export Excel
</button>
<button
  onClick={handleExportPDF}
  className="px-4 py-2 rounded-lg text-sm lg:text-base font-medium bg-red-600 text-white hover:bg-red-700 transition-colors touch-manipulation"
>
  📄 Export PDF
</button>


          </div>

          {/* Date Picker for specific date */}
          {selectedFilter === "date" && (
            <div className="flex gap-2 items-center">
              <label className="text-sm text-gray-600 font-medium">
                Select Date:
              </label>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b46c1]"
              />
            </div>
          )}

          {/* Custom Date Range Picker */}
          {selectedFilter === "custom" && (
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-2 items-center">
                <label className="text-sm text-gray-600 font-medium">
                  From:
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b46c1]"
                />
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-sm text-gray-600 font-medium">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b46c1]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-sm mx-auto lg:max-w-6xl px-6 py-6 lg:py-8">
        {/* Budget Alert - Show at top if exists */}
        {budgetAlert && (
          <div
            className={`mb-6 lg:mb-8 rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border-2 ${
              budgetAlert.type === "danger"
                ? "bg-red-50 border-red-300 animate-pulse"
                : budgetAlert.type === "warning"
                ? "bg-yellow-50 border-yellow-300 animate-pulse"
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
          {/* Left Column - Chart and Total */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Spending by Category Section */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-6 lg:mb-8">
                Spending by Category
              </h2>

              {/* Donut Chart */}
              <div className="flex justify-center mb-6 lg:mb-8">
                <div className="relative w-48 h-48 lg:w-64 lg:h-64">
                  {totalSpent > 0 ? (
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 200 200"
                    >
                      {/* Background circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="16"
                      />

                      {/* Dynamic category segments */}
                      {categoryData.map((category, index) => {
                        const strokeColors = {
                          "bg-cyan-500": "#06b6d4",
                          "bg-orange-500": "#f97316",
                          "bg-blue-500": "#3b82f6",
                          "bg-yellow-500": "#eab308",
                          "bg-gray-500": "#6b7280",
                          "bg-purple-500": "#a855f7",
                        };

                        const circumference = 2 * Math.PI * 80;
                        const strokeDasharray = `${
                          (category.percentage / 100) * circumference
                        } ${circumference}`;

                        // Calculate offset based on previous segments
                        let previousPercentages = 0;
                        for (let i = 0; i < index; i++) {
                          previousPercentages += categoryData[i].percentage;
                        }
                        const strokeDashoffset = -(
                          (previousPercentages / 100) *
                          circumference
                        );

                        return (
                          <circle
 key={`${index}-${selectedFilter}-${totalSpent}`}
  cx="100"
  cy="100"
  r="80"
  fill="none"
  stroke={strokeColors[category.color] || "#6b7280"}
  strokeWidth="16"
  strokeDasharray={`${circumference} ${circumference}`}
  strokeDashoffset={
    animateBars
      ? circumference - (category.percentage / 100) * circumference
      : circumference
  }
  strokeLinecap="round"
  className="transition-all duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
/>
                        );
                      })}
                    </svg>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
                      <p className="text-gray-500 text-sm ">No data</p>
                    </div>
                  )}

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 h-13">
                      ₹{totalSpent.toLocaleString()}/-
                    </p>
                    <p className="text-gray-500 text-sm lg:text-base ">
                      {selectedFilter === "today"
                        ? "Total Today"
                        : selectedFilter === "week"
                        ? "Total This Week"
                        : selectedFilter === "month"
                        ? "Total This Month"
                        : selectedFilter === "date" && specificDate
                        ? "Total on Date"
                        : selectedFilter === "custom" && customStartDate
                        ? "Total in Range"
                        : "Total Spent"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Legend */}
              {categoryData.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {categoryData.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 lg:gap-3 bg-gray-50 rounded-lg p-3 lg:p-4"
                    >
                      <div
                        className={`w-3 h-3 lg:w-4 lg:h-4 rounded-full ${category.progressColor}`}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium text-xs lg:text-sm truncate">
                          {category.name}
                        </p>
                        <p className="text-gray-500 text-xs lg:text-sm">
                          {category.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No spending data available for this month
                  </p>
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-800 mb-6 lg:mb-8">
                Category Breakdown
              </h3>

              {categoryData.length > 0 ? (
                <div className="space-y-4 lg:space-y-6">
                  {categoryData.map((category, index) => (
                    <div key={index} className="space-y-2 lg:space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div
                            className={`w-8 h-8 lg:w-10 lg:h-10 ${category.color} rounded-lg flex items-center justify-center`}
                          >
                            <span className="text-white text-sm lg:text-base">
                              {category.icon}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800 lg:text-lg">
                            {category.name}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900 lg:text-lg">
                          ₹{category.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 lg:h-3 overflow-hidden">
                        <div
                        key={`${index}-${animateBars}`}
                          className={`${category.progressColor} h-2 lg:h-3 rounded-full transition-all duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]`}
                          style={{
                            width: animateBars
                             ? `${Math.min(category.percentage, 100)}%`
                             : "0%" ,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No expense categories found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Insights */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <div className="bg-white rounded-xl lg:rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-800 mb-6 lg:mb-8">
                Insights
              </h3>

              <div className="space-y-4 lg:space-y-6">
                {insights.length > 0 ? (
                  insights.map((insight, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 lg:gap-4"
                    >
                      <div className="w-2 h-2 lg:w-3 lg:h-3 bg-[#6b46c1] rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm lg:text-base leading-relaxed">
                        {insight}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No insights available yet</p>
                  </div>
                )}
              </div>

              {/* Additional Insights Placeholder */}
              <div className="mt-8 lg:mt-12 p-4 lg:p-6 bg-[#6b46c1]/5 rounded-lg lg:rounded-xl border border-[#6b46c1]/20">
                <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#6b46c1] rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm lg:text-base">💡</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 lg:text-lg">
                    Spending Tip
                  </h4>
                </div>
                <p className="text-gray-600 text-sm lg:text-base leading-relaxed">
                  Consider setting a monthly budget for shopping to better
                  control your expenses.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 lg:mt-8 space-y-3 lg:space-y-4">
                <div className="flex justify-between items-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-sm lg:text-base">
                    Highest Category
                  </span>
                  <span className="font-semibold text-gray-900 lg:text-lg">
                    {summary.highestCategory || "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-sm lg:text-base">
                    Lowest Category
                  </span>
                  <span className="font-semibold text-gray-900 lg:text-lg">
                    {summary.lowestCategory || "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-sm lg:text-base">
                    Categories
                  </span>
                  <span className="font-semibold text-gray-900 lg:text-lg">
                    {summary.totalCategories || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-sm lg:text-base">
                    Budget Used
                  </span>
                  <span className="font-semibold text-gray-900 lg:text-lg">
                    {summary.monthlyBudget
                      ? `${Math.round(
                          (summary.usedBudget / summary.monthlyBudget) * 100
                        )}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
