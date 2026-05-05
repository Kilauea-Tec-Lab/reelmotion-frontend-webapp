import { useState } from "react";
import { X, Send, Star } from "lucide-react";
import { submitSuggestion } from "./help-functions";
import { useI18n } from "../i18n/i18n-context";

function SuggestionsForm({ onClose }) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    category: "",
    rating: 0,
    suggestion: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: "User Interface", label: t("suggestions.cat.ui") },
    { value: "AI Generation", label: t("suggestions.cat.ai") },
    { value: "Performance", label: t("suggestions.cat.performance") },
    { value: "New Features", label: t("suggestions.cat.features") },
    { value: "Documentation", label: t("suggestions.cat.documentation") },
    { value: "Support", label: t("suggestions.cat.support") },
    { value: "Other", label: t("suggestions.cat.other") },
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
      alert(t("suggestions.alert-fill"));
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
      alert(t("suggestions.alert-error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-4 z-50 bg-darkBox rounded-2xl shadow-2xl p-6 flex flex-col justify-center md:inset-auto md:bottom-6 md:right-24 md:w-96">
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
            {t("suggestions.thanks-title")}
          </h3>
          <p className="text-gray-400 montserrat-regular text-sm">
            {t("suggestions.thanks-desc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-darkBox rounded-2xl shadow-2xl overflow-y-auto md:inset-auto md:bottom-6 md:right-24 md:w-96 md:max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-darkBox">
        <div>
          <h3 className="text-white montserrat-medium text-lg">{t("suggestions.title")}</h3>
          <p className="text-gray-400 montserrat-light text-sm">
            {t("suggestions.subtitle")}
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
            {t("suggestions.category")} *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full bg-darkBoxSub text-white border border-gray-600 rounded-lg px-3 py-2 montserrat-regular text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            required
          >
            <option value="">{t("suggestions.select-category")}</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-white montserrat-medium text-sm mb-2">
            {t("suggestions.rating")} *
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
                      ? "text-white fill-current"
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
            {t("suggestions.your-suggestion")} *
          </label>
          <textarea
            name="suggestion"
            value={formData.suggestion}
            onChange={handleInputChange}
            placeholder={t("suggestions.placeholder")}
            rows={4}
            className="w-full bg-darkBoxSub text-white border border-gray-600 rounded-lg px-3 py-2 montserrat-regular text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-white montserrat-medium text-sm mb-2">
            {t("suggestions.email")} *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t("suggestions.email-placeholder")}
            className="w-full bg-darkBoxSub text-white border border-gray-600 rounded-lg px-3 py-2 montserrat-regular text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            required
          />
          <p className="text-gray-500 montserrat-light text-xs mt-1">
            {t("suggestions.email-help")}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid()}
          className="w-full bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-3 rounded-lg montserrat-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {t("suggestions.sending")}
            </>
          ) : (
            <>
              <Send size={16} />
              {t("suggestions.send")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default SuggestionsForm;
