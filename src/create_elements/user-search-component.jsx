import { useState, useEffect, useRef } from "react";
import { Search, X, User, Plus, Check, AlertCircle } from "lucide-react";
import { searchUsers } from "./functions";

function UserSearchComponent({ selectedUsers, onUsersChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");
  const searchTimeoutRef = useRef(null);
  const searchRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setError("");
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await searchUsers(searchTerm.trim());

        if (
          response.success &&
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          // Filter out users that are already selected
          const availableUsers = response.data.filter(
            (user) => !selectedUsers.some((selected) => selected.id === user.id)
          );

          if (availableUsers.length === 0) {
            setError("All found users are already added to the shared list");
            setSearchResults([]);
            setShowResults(false);
          } else {
            setSearchResults(availableUsers);
            setShowResults(true);
          }
        } else {
          // No users found or error
          setError(`No users found with search term "${searchTerm.trim()}"`);
          setSearchResults([]);
          setShowResults(false);
        }
      } catch (error) {
        console.error("Search error:", error);
        setError("Error searching for users. Please try again.");
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, selectedUsers]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        setError("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddUser = (user) => {
    onUsersChange([...selectedUsers, user]);
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleRemoveUser = (userId) => {
    onUsersChange(selectedUsers.filter((user) => user.id !== userId));
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div ref={searchRef} className="relative">
        <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
          Share with Users
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username..."
            className="w-full pl-10 pr-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-[#F2D543] rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="left-0 right-0 mt-1 bg-red-900/20 border border-red-500 rounded-lg p-3 z-10">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm montserrat-regular">{error}</p>
            </div>
          </div>
        )}

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-darkBoxSub rounded-lg shadow-xl border border-gray-600 max-h-48 overflow-y-auto z-10">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAddUser(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-darkBox transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0">
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={16} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white montserrat-medium truncate">
                      @{user.username}
                    </p>
                    {(user.name || user.last_name) && (
                      <p className="text-xs text-gray-400 montserrat-light truncate">
                        {[user.name, user.last_name].filter(Boolean).join(" ")}
                      </p>
                    )}
                  </div>
                  <Plus size={16} className="text-[#F2D543] flex-shrink-0" />
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-400 text-sm montserrat-light">
                {searchTerm.trim().length < 2
                  ? "Type at least 2 characters to search"
                  : "No users found"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
            Shared with ({selectedUsers.length})
          </label>
          <div className="space-y-2">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-4 py-2 bg-darkBoxSub rounded-lg"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0">
                  {user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white montserrat-medium truncate">
                    @{user.username || `user-${user.id.slice(0, 8)}`}
                  </p>
                  {(user.name || user.last_name) && (
                    <p className="text-xs text-gray-400 montserrat-light truncate">
                      {[user.name, user.last_name].filter(Boolean).join(" ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-green-400" />
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserSearchComponent;
