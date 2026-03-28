import React, { useState, useRef } from "react";

export default function AddExpense({ onBack, onSave }) {
  const [receipt, setReceipt] = useState(null);
  const fileInputRef = useRef(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [date, setDate] = useState("");
  const [splits, setSplits] = useState([]);//newly added
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSplit, setShowSplit] = useState(false);

  const addPerson = () => {
    setShowSplit(true);
  setSplits([...splits, { name: "", amount: "" }]);
};

const handleSplitChange = (index, field, value) => {
  const updated = [...splits];
  updated[index][field] = value;
  setSplits(updated);
};

const totalSplit = splits.reduce(
    (sum, s) => sum + (parseFloat(s.amount) || 0),
    0
  );

  const categories = [
    { id: "food", name: "Food & Dining", icon: "🍽️", color: "bg-cyan-500" },
    {
      id: "transport",
      name: "Transportation",
      icon: "🚗",
      color: "bg-orange-500",
    },
    { id: "shopping", name: "Shopping", icon: "🛍️", color: "bg-yellow-500" },
    {
      id: "utilities",
      name: "Home & Utilities",
      icon: "⚡",
      color: "bg-blue-500",
    },
    {
      id: "entertainment",
      name: "Entertainment",
      icon: "🎭",
      color: "bg-purple-500",
    },
    { id: "other", name: "Other", icon: "💰", color: "bg-gray-500" },
  ];

  const handleSubmit = async () => {
    if (amount && description && selectedCategory) {
      setLoading(true);
      setError(null);

      try {
        let expenseDate;
        if (date) {
          // If user selected a date, use that date but with current time
          const selectedDate = new Date(date);
          const now = new Date();
          selectedDate.setHours(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
          );
          expenseDate = selectedDate.toISOString();
        } else {
          // If no date selected, use current date and time
          expenseDate = new Date().toISOString();
        }

        const numericAmount = parseFloat(amount);
        if (showSplit && totalSplit !== numericAmount) {
  setError("Split amounts must equal the total expense.");
  setLoading(false);
  return;
}
        let splitData = [];
        if(showSplit){
           splitData = splits.map((s) => ({
  name: s.name,
  amount: parseFloat(s.amount)
}));
        }


        const formData = new FormData();
      formData.append("amount", numericAmount);
      formData.append("description", description);
      formData.append("category", selectedCategory);
      formData.append("date", expenseDate);
      if(showSplit){
      formData.append("splits", JSON.stringify(splitData));
      }
      if(receipt){
        formData.append("receipt", receipt);
      }

        await onSave(formData);

        setAmount("");
        setDescription("");
        setSelectedCategory("");
        setDate("");
        setSplits([]);
        setShowSplit(false);
        setReceipt(null);

      } catch (err) {
        setError(err.message);
        console.error("Error saving expense:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setAmount("");
    setDescription("");
    setSelectedCategory("");
    setDate("");
    onBack();
  };

  const handleReceiptClick = () => {
  if (fileInputRef.current) {
    fileInputRef.current.click(); // Opens camera/gallery
  }
};

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setReceipt(file);
    console.log("Receipt selected:", file.name);
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#6b46c1] shadow-lg">
        <div className="max-w-sm mx-auto lg:max-w-6xl px-6 py-6 lg:py-8">
          <div className="flex items-center gap-4">
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
            <h1 className="text-xl lg:text-3xl font-semibold">Add Expense</h1>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-sm mx-auto lg:max-w-4xl px-6 py-8 lg:py-12">
        <div className="lg:bg-white lg:rounded-2xl lg:shadow-xl lg:p-8 lg:border lg:border-gray-200">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm lg:text-base">{error}</p>
            </div>
          )}

          {/* Amount Input */}
          <div className="mb-8 lg:mb-10">
            <label className="block text-gray-700 text-sm lg:text-base font-medium mb-3 lg:mb-4">
              Enter Amount
            </label>
            <input
              type="number"
              placeholder="₹Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-4 lg:px-6 lg:py-5 border border-gray-300 rounded-lg lg:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b46c1] focus:border-transparent text-lg lg:text-xl"
            />
          </div>

          {/* Description Input */}
          <div className="mb-8 lg:mb-10">
            <label className="block text-gray-700 text-sm lg:text-base font-medium mb-3 lg:mb-4">
              Description
            </label>
            <textarea
              placeholder="Enter description......."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-4 lg:px-6 lg:py-5 border border-gray-300 rounded-lg lg:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b46c1] focus:border-transparent resize-none text-lg lg:text-xl"
            />
          </div>

  {/* Split Expense */}
<div className="mb-8 lg:mb-10">
  <label className="block text-gray-700 text-sm lg:text-base font-medium mb-3 lg:mb-4">
    Split Expense
  </label>

  {/* If split not enabled */}
  {!showSplit && (
    <button
      type="button"
      onClick={addPerson}
      className="text-[#6b46c1] font-semibold"
    >
      + Add Person
    </button>
  )}

  {/* If split enabled */}
  {showSplit && (
    <>
      {splits.map((split, index) => (
        <div key={index} className="flex gap-3 mb-3">

          <input
            type="text"
            placeholder="Name"
            value={split.name}
            onChange={(e) =>
              handleSplitChange(index, "name", e.target.value)
            }
            className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b46c1]"
          />

          <input
            type="number"
            placeholder="Amount"
            value={split.amount}
            onChange={(e) =>
              handleSplitChange(index, "amount", e.target.value)
            }
            className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b46c1]"
          />

        </div>
      ))}

      <button
        type="button"
        onClick={addPerson}
        className="text-[#6b46c1] font-semibold mt-2"
      >
        + Add Person
      </button>

      {amount && (
        <p
          className={`text-sm mt-2 font-medium ${
            totalSplit === parseFloat(amount)
              ? "text-green-600"
              : "text-red-500"
          }`}
        >
          Total split: ₹{totalSplit.toFixed(2)} / ₹{amount}
        </p>
      )}
    </>
  )}
</div>


          {/* Category Selection */}
          <div className="mb-8 lg:mb-10">
            <label className="block text-gray-700 text-sm lg:text-base font-medium mb-4 lg:mb-6">
              Category
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-3 p-4 lg:p-5 rounded-lg lg:rounded-xl border-2 transition-all ${
                    selectedCategory === category.id
                      ? "border-[#6b46c1] bg-[#6b46c1]/10 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`w-10 h-10 lg:w-12 lg:h-12 ${category.color} rounded-full flex items-center justify-center text-white text-lg lg:text-xl`}
                  >
                    {category.icon}
                  </div>
                  <span className="text-gray-800 text-sm lg:text-base font-medium">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date and Receipt */}
          <div className="mb-10 lg:mb-12">
            <label className="block text-gray-700 text-sm lg:text-base font-medium mb-4 lg:mb-6">
              Date
            </label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">

          {/* Hidden input */}
           <input
            type="file"
           accept="image/*"
           capture="environment"
           ref={fileInputRef}
           onChange={handleFileChange}
           style={{ display: "none" }}
           />

          <button
           type="button"
           onClick={() => fileInputRef.current.click()}
           className="flex items-center gap-4 p-4 lg:p-5 border border-gray-300 rounded-lg lg:rounded-xl bg-white hover:border-gray-400 transition-colors"
           >
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-800 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 lg:w-6 lg:h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v1.586l8 8 8-8V5a2 2 0 00-2-2H4zm0 3.414v9.172a2 2 0 002 2h8a2 2 0 002-2V6.414l-6 6-6-6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm lg:text-base font-medium">
                  Add receipt
                </span>
              </button>
              {receipt && (
  <div className="mt-4">
    <img
      src={URL.createObjectURL(receipt)}
      alt="Receipt Preview"
      className="w-full rounded-lg border"
    />
  </div>
)}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-4 py-4 lg:px-6 lg:py-5 border border-gray-300 rounded-lg lg:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b46c1] focus:border-transparent text-gray-700 text-lg lg:text-xl"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 lg:flex lg:space-y-0 lg:space-x-6 lg:justify-center">
            <button
              onClick={handleSubmit}
              disabled={!amount || !description || !selectedCategory || loading}
              className="w-full lg:w-48 bg-[#6b46c1] text-white py-4 lg:py-5 rounded-lg lg:rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#5a3aa8] transition-colors shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                "Add Expense"
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full lg:w-48 bg-white border-2 border-gray-300 text-gray-700 py-4 lg:py-5 rounded-lg lg:rounded-xl font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
