import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Settings,
  User,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Edit3,
  Save,
  X,
  Wallet,
  Eye,
  EyeOff,
  Lock,
  Copy,
  Gift,
} from "lucide-react";
import { useLoaderData } from "react-router-dom";
import { updateUserProfile } from "./functions";

function Profile() {
  const initialUser = useLoaderData();
  const [user, setUser] = useState(initialUser);
  const [profileImage, setProfileImage] = useState(user?.data?.image || null);
  const [previewImage, setPreviewImage] = useState(null); // Nueva imagen seleccionada (vista previa)
  const [selectedImageFile, setSelectedImageFile] = useState(null); // Archivo de imagen para envío
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.data?.name || "",
    email: user?.data?.email || "",
    solana_wallet_address: user?.data?.solana_wallet_address || "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    email: "",
    profile_image: "",
  });
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Limpiar URL del objeto cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  // Validation functions based on backend rules
  const validateName = (name) => {
    if (name && name.length > 255) {
      return "Name cannot exceed 255 characters";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (email) {
      if (email.length > 255) {
        return "Email cannot exceed 255 characters";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return "Please enter a valid email address";
      }
    }
    return "";
  };

  const validateProfileImage = (file) => {
    if (file) {
      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        return "Please select a valid image file (JPEG, PNG, JPG, or GIF)";
      }

      // Check file size (10MB = 10240KB)
      const maxSize = 10240 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        return "Image size cannot exceed 10MB";
      }
    }
    return "";
  };

  const clearValidationError = (field) => {
    setValidationErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const setValidationError = (field, error) => {
    setValidationErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  // Validate entire form based on backend rules
  const validateForm = () => {
    const errors = {
      name: validateName(editForm.name),
      email: validateEmail(editForm.email),
      profile_image: selectedImageFile
        ? validateProfileImage(selectedImageFile)
        : "",
    };

    // Check if any validation errors exist
    const hasErrors = Object.values(errors).some((error) => error !== "");

    // Update validation errors state
    setValidationErrors(errors);

    return !hasErrors;
  };

  // Check if form is valid (for button state)
  const isFormValid = () => {
    const nameError = validateName(editForm.name);
    const emailError = validateEmail(editForm.email);
    const imageError = selectedImageFile
      ? validateProfileImage(selectedImageFile)
      : "";

    return !nameError && !emailError && !imageError;
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate image using backend rules
    const imageError = validateProfileImage(file);
    if (imageError) {
      setValidationError("profile_image", imageError);
      return;
    }

    // Clear any previous image validation errors
    clearValidationError("profile_image");

    // Solo crear vista previa, no subir al backend aún
    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
    setSelectedImageFile(file);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancelar edición
      setIsEditing(false);
      setPreviewImage(null);
      setSelectedImageFile(null);
      setPasswordError("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setEditForm({
        name: user?.data?.name || "",
        email: user?.data?.email || "",
        solana_wallet_address: user?.data?.solana_wallet_address || "",
        password: "",
        confirmPassword: "",
      });
    } else {
      // Activar edición
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    // First validate all form fields
    if (!validateForm()) {
      // If validation fails, don't proceed
      return;
    }

    // Validar contraseñas si se proporcionaron
    if (editForm.password || editForm.confirmPassword) {
      if (editForm.password !== editForm.confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }
      if (editForm.password.length < 6) {
        setPasswordError("Password must be at least 6 characters long");
        return;
      }
    }

    setPasswordError("");
    setIsUploading(true);

    try {
      const profileData = {
        name: editForm.name,
        email: editForm.email,
        solana_wallet_address: editForm.solana_wallet_address,
      };

      // Agregar contraseña solo si se proporcionó
      if (editForm.password) {
        profileData.password = editForm.password;
      }

      // Agregar imagen solo si hay una nueva seleccionada
      if (selectedImageFile) {
        profileData.profile_image = selectedImageFile;
      }

      const result = await updateUserProfile(profileData);

      if (result.success) {
        // Actualizar el estado del usuario con la nueva información del backend
        setUser(result);

        // Actualizar la imagen de perfil si cambió
        if (result?.data?.image) {
          setProfileImage(result?.data?.image);
        }

        // Actualizar el formulario con los nuevos datos (sin contraseñas)
        setEditForm({
          name: result?.data?.name || "",
          email: result?.data?.email || "",
          solana_wallet_address: result?.data?.solana_wallet_address || "",
          password: "",
          confirmPassword: "",
        });

        // Limpiar vista previa y estados de edición
        setPreviewImage(null);
        setSelectedImageFile(null);
        setIsEditing(false);
        setPasswordError("");
        setShowPassword(false);
        setShowConfirmPassword(false);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error updating profile. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Real-time validation
    let error = "";
    switch (field) {
      case "name":
        error = validateName(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
    }

    if (error) {
      setValidationError(field, error);
    } else {
      clearValidationError(field);
    }

    // Limpiar error de contraseña cuando el usuario escriba
    if (
      (field === "password" || field === "confirmPassword") &&
      passwordError
    ) {
      setPasswordError("");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const copyRewardsLink = async () => {
    const rewardsLink = `https://reelmotion.ai/login?code=${
      user?.data?.email || ""
    }`;

    try {
      await navigator.clipboard.writeText(rewardsLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = rewardsLink;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackErr) {
        console.error("Failed to copy link:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="min-h-screen bg-primarioDark p-6">
      <div className="max-w-4xl mx-auto">
        {/* Rewards Link Widget */}
        <div className="bg-darkBox border border-gray-600 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F2D543] rounded-lg">
                <Gift className="w-5 h-5 text-primarioDark" />
              </div>
              <div>
                <h3 className="text-white montserrat-medium text-sm">
                  Share Your Rewards Link
                </h3>
                <p className="text-gray-400 text-xs montserrat-regular">
                  Invite friends and earn rewards
                </p>
              </div>
            </div>
            <button
              onClick={copyRewardsLink}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                copySuccess
                  ? "bg-green-600 text-white"
                  : "bg-[#F2D543] hover:bg-[#f2f243] text-primarioDark"
              }`}
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm montserrat-medium">
                {copySuccess ? "Copied!" : "Copy Link"}
              </span>
            </button>
          </div>
          <div className="mt-3 p-3 bg-darkBoxSub rounded-lg border border-gray-700">
            <p className="text-gray-300 text-sm montserrat-regular break-all">
              {`https://reelmotion.ai/login?code=${user?.data?.email || ""}`}
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white montserrat-medium text-3xl tracking-wider">
            Profile
          </h1>

          {/* Edit/Save/Cancel Buttons */}
          {!isEditing ? (
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-2 bg-darkBox hover:bg-darkBoxSub transition-colors px-4 py-2 rounded-lg text-white"
            >
              <Edit3 size={18} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveProfile}
                disabled={isUploading || !isFormValid()}
                className="flex items-center gap-2 bg-[#F2D543] hover:bg-[#f2f243] transition-colors px-4 py-2 rounded-lg text-primarioDark font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {isUploading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleEditToggle}
                disabled={isUploading}
                className="flex items-center gap-2 bg-primarioLogo transition-colors px-4 py-2 rounded-lg text-white disabled:opacity-50"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Image and Basic Info */}
          <div className="lg:col-span-1">
            <div className="bg-darkBox rounded-2xl p-6">
              {/* Profile Image */}
              <div className="relative mx-auto w-32 h-32 mb-6">
                <div className="w-full h-full rounded-full overflow-hidden bg-darkBoxSub flex items-center justify-center">
                  {previewImage || profileImage ? (
                    <img
                      src={previewImage || profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} className="text-gray-400" />
                  )}
                </div>

                {/* Upload Button - Solo visible en modo edición */}
                {isEditing && (
                  <button
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 bg-[#F2D543] hover:bg-[#f2f243] transition-colors p-2 rounded-full text-primarioDark disabled:opacity-50"
                  >
                    <Camera size={16} />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Image validation error */}
                {validationErrors.profile_image && (
                  <p className="text-red-400 montserrat-light text-xs mt-2 text-center">
                    {validationErrors.profile_image}
                  </p>
                )}
              </div>

              {/* User Name and Role */}
              <div className="text-center">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="bg-darkBoxSub rounded-lg px-3 py-2 text-white text-xl text-center montserrat-medium mb-2 w-full focus:outline-none focus:ring-2 focus:ring-[#F2D543]"
                      placeholder="Enter your name"
                    />
                    {validationErrors.name && (
                      <p className="text-red-400 montserrat-light text-xs mt-1 text-center">
                        {validationErrors.name}
                      </p>
                    )}
                  </>
                ) : (
                  <h2 className="text-white montserrat-medium text-xl mb-2">
                    {user?.data?.name || "User Name"}
                  </h2>
                )}
                <p className="text-gray-400 montserrat-light text-sm">
                  Content Creator
                </p>
                {isUploading && (
                  <p className="text-[#F2D543] montserrat-light text-xs mt-2">
                    Saving changes...
                  </p>
                )}
                {previewImage && !isUploading && (
                  <p className="text-blue-400 montserrat-light text-xs mt-2">
                    New image selected
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2">
            <div className="bg-darkBox rounded-2xl p-6">
              <h3 className="text-white montserrat-medium text-xl mb-6">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-darkBoxSub p-2 rounded-lg">
                    <Mail size={18} className="text-[#F2D543]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 montserrat-light text-sm">
                      Email
                    </p>
                    {isEditing ? (
                      <>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="bg-darkBoxSub rounded-lg px-3 py-2 text-white montserrat-regular w-full focus:outline-none focus:ring-2 focus:ring-[#F2D543]"
                          placeholder="Enter your email"
                        />
                        {validationErrors.email && (
                          <p className="text-red-400 montserrat-light text-xs mt-1">
                            {validationErrors.email}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-white montserrat-regular">
                        {user?.data?.email || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-darkBoxSub p-2 rounded-lg">
                    <User size={18} className="text-[#F2D543]" />
                  </div>
                  <div>
                    <p className="text-gray-400 montserrat-light text-sm">
                      Username
                    </p>
                    <p className="text-white montserrat-regular">
                      {user?.data?.username || "Username"}
                    </p>
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-darkBoxSub p-2 rounded-lg">
                    <Calendar size={18} className="text-[#F2D543]" />
                  </div>
                  <div>
                    <p className="text-gray-400 montserrat-light text-sm">
                      Member Since
                    </p>
                    <p className="text-white montserrat-regular">
                      {user?.data?.created_at
                        ? new Date(user.data.created_at).toLocaleDateString()
                        : "Not available"}
                    </p>
                  </div>
                </div>

                {/* Solana Wallet Address */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-darkBoxSub p-2 rounded-lg">
                    <Wallet size={18} className="text-[#F2D543]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 montserrat-light text-sm">
                      Solana Wallet Address
                    </p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.solana_wallet_address}
                        onChange={(e) =>
                          handleInputChange(
                            "solana_wallet_address",
                            e.target.value
                          )
                        }
                        className="bg-darkBoxSub rounded-lg px-3 py-2 text-white montserrat-regular w-full focus:outline-none focus:ring-2 focus:ring-[#F2D543]"
                        placeholder="Enter your Solana wallet address"
                      />
                    ) : (
                      <p className="text-white montserrat-regular">
                        {user?.data?.solana_wallet_address || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Field - Only visible when editing */}
                {isEditing && (
                  <div className="flex items-center gap-3">
                    <div className="bg-darkBoxSub p-2 rounded-lg">
                      <Lock size={18} className="text-[#F2D543]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-400 montserrat-light text-sm">
                        New Password
                      </p>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={editForm.password}
                          onChange={(e) =>
                            handleInputChange("password", e.target.value)
                          }
                          className="bg-darkBoxSub rounded-lg px-3 py-2 pr-10 text-white montserrat-regular w-full focus:outline-none focus:ring-2 focus:ring-[#F2D543]"
                          placeholder="Enter new password (optional)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Password Field - Only visible when editing */}
                {isEditing && (
                  <div className="flex items-center gap-3">
                    <div className="bg-darkBoxSub p-2 rounded-lg">
                      <Lock size={18} className="text-[#F2D543]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-400 montserrat-light text-sm">
                        Confirm Password
                      </p>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={editForm.confirmPassword}
                          onChange={(e) =>
                            handleInputChange("confirmPassword", e.target.value)
                          }
                          className="bg-darkBoxSub rounded-lg px-3 py-2 pr-10 text-white montserrat-regular w-full focus:outline-none focus:ring-2 focus:ring-[#F2D543]"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Error Message */}
              {passwordError && isEditing && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 montserrat-regular text-sm">
                    {passwordError}
                  </p>
                </div>
              )}

              {/* Stats Section */}
              <div className="mt-8 pt-6">
                <h4 className="text-white montserrat-medium text-lg mb-4">
                  Activity Stats
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-darkBoxSub rounded-lg p-4 text-center">
                    <p className="text-[#F2D543] montserrat-medium text-2xl">
                      {user?.projects || 0}
                    </p>
                    <p className="text-gray-400 montserrat-light text-sm">
                      Total Projects
                    </p>
                  </div>

                  <div className="bg-darkBoxSub rounded-lg p-4 text-center">
                    <p className="text-[#F2D543] montserrat-medium text-2xl">
                      {user?.projects_complete || 0}
                    </p>
                    <p className="text-gray-400 montserrat-light text-sm">
                      Completed
                    </p>
                  </div>

                  <div className="bg-darkBoxSub rounded-lg p-4 text-center">
                    <p className="text-[#F2D543] montserrat-medium text-2xl">
                      {user?.folders || 0}
                    </p>
                    <p className="text-gray-400 montserrat-light text-sm">
                      Folders
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
