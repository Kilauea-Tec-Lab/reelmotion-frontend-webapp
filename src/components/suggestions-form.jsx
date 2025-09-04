import { useState } from "react";
import { X, Send, Star } from "lucide-react";
import { submitSuggestion } from "./help-functions";

function SuggestionsForm({ onClose }) {
  const [formData, setFormData] = useState({
    category: "",
    rating: 0,
    suggestion: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    "User Interface",
    "AI Generation",
    "Performance",
    "New Features",
    "Documentation",
    "Support",
    "Other",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingClick = (rating) => {
    setFormData((prev) => ({
      ...prev,
      rating,
    }));
  };

  const isFormValid = () => {
    return (
      formData.category.trim() !== "" &&
      formData.rating > 0 &&
      formData.suggestion.trim() !== "" &&
      formData.email.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación adicional antes de enviar
    if (!isFormValid()) {
      alert("Please fill in all required fields with valid information.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitSuggestion(formData);

      if (response.success !== false) {
        setSubmitted(true);

        // Auto close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(response.error || "Error al enviar la sugerencia");
      }
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      alert("Error sending suggestion. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed bottom-6 left-20 z-50 bg-darkBox rounded-2xl shadow-2xl w-96 p-6 border border-darkBoxSub">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-white montserrat-medium text-lg mb-2">
            Thank you for your feedback!
          </h3>
          <p className="text-gray-400 montserrat-regular text-sm">
            Your suggestion has been sent and will help us improve Reelmotion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-20 z-50 bg-darkBox rounded-2xl shadow-2xl w-96 max-h-[600px] overflow-y-auto border border-darkBoxSub">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-darkBoxSub sticky top-0 bg-darkBox">
        <div>
          <h3 className="text-white montserrat-medium text-lg">Suggestions</h3>
          <p className="text-gray-400 montserrat-light text-sm">
            Help us improve Reelmotion
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Category */}
        <div>
          <label className="block text-white montserrat-medium text-sm mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full bg-darkBoxSub text-white border border-gray-600 rounded-lg px-3 py-2 montserrat-regular text-sm focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-white montserrat-medium text-sm mb-2">
            Overall rating *
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(star)}
                className="p-1 transition-colors"
              >
                <Star
                  size={24}
                  className={
                    star <= formData.rating
                      ? "text-[#F2D543] fill-current"
                      : "text-gray-400"
                  }
                />
              </button>
            ))}
            <span className="text-gray-400 montserrat-light text-sm ml-2">
              {formData.rating > 0 && `${formData.rating}/5`}
            </span>
          </div>
        </div>

        {/* Suggestion */}
        <div>
          <label className="block text-white montserrat-medium text-sm mb-2">
            Your suggestion *
          </label>
          <textarea
            name="suggestion"
            value={formData.suggestion}
            onChange={handleInputChange}
            placeholder="Tell us what we can improve or what new features you'd like to see..."
            rows={4}
            className="w-full bg-darkBoxSub text-white border border-gray-600 rounded-lg px-3 py-2 montserrat-regular text-sm focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-white montserrat-medium text-sm mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your@email.com"
            className="w-full bg-darkBoxSub text-white border border-gray-600 rounded-lg px-3 py-2 montserrat-regular text-sm focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent"
            required
          />
          <p className="text-gray-500 montserrat-light text-xs mt-1">
            We need your email to follow up on your suggestion
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid()}
          className="w-full bg-[#F2D543] hover:bg-[#f2f243] disabled:bg-gray-600 disabled:cursor-not-allowed text-primarioDark py-3 rounded-lg montserrat-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-primarioDark border-t-transparent rounded-full animate-spin"></div>
              Sending...
            </>
          ) : (
            <>
              <Send size={16} />
              Send Suggestion
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default SuggestionsForm;
