import { X, Trash2, AlertTriangle } from "lucide-react";

function ModalConfirmDelete({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item?",
  itemName = "",
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#DC569D30] bg-opacity-20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-primarioLogo" />
            </div>
            <h2 className="text-xl font-semibold text-white montserrat-medium">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-300 mb-2">{message}</p>
            {itemName && (
              <div className="bg-[#DC569D30] bg-opacity-10 border border-primarioLogo border-opacity-30 rounded-lg p-4">
                <p className="text-[#DC569D] font-medium break-words">
                  "{itemName}"
                </p>
              </div>
            )}
            <p className="text-gray-400 text-sm mt-3">
              This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors montserrat-regular disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-primarioLogo text-white rounded-lg hover:bg-[#DC569D50] transition-colors montserrat-medium flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmDelete;
