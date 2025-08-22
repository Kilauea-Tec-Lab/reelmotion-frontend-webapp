import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Settings,
  User,
  Mail,
  Phone,
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
} from "lucide-react";
import { useLoaderData } from "react-router-dom";
import { updateUserProfile } from "./functions";

function Profile() {
  const user = useLoaderData();
  const [profileImage, setProfileImage] = useState(user?.data?.image || null);
  const [previewImage, setPreviewImage] = useState(null); // Nueva imagen seleccionada (vista previa)
  const [selectedImageFile, setSelectedImageFile] = useState(null); // Archivo de imagen para envío
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.data?.name || "",
    email: user?.data?.email || "",
    phone: user?.data?.phone || "",
    solana_wallet_address: user?.data?.solana_wallet_address || "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const fileInputRef = useRef(null);

  // Limpiar URL del objeto cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

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
        phone: user?.data?.phone || "",
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
        phone: editForm.phone,
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
        // Actualizar el estado con la nueva información
        if (result?.data?.image) {
          setProfileImage(result?.data?.image);
        }

        // Limpiar vista previa
        setPreviewImage(null);
        setSelectedImageFile(null);
        setIsEditing(false);
        setPasswordError("");
        setShowPassword(false);
        setShowConfirmPassword(false);

        window.location.reload(); // Recargar la página para reflejar los cambios
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
    
    // Limpiar error de contraseña cuando el usuario escriba
    if ((field === 'password' || field === 'confirmPassword') && passwordError) {
      setPasswordError("");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-primarioDark p-6">
      <div className="max-w-4xl mx-auto">
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
                disabled={isUploading}
                className="flex items-center gap-2 bg-[#F2D543] hover:bg-[#f2f243] transition-colors px-4 py-2 rounded-lg text-primarioDark font-medium disabled:opacity-50"
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
              </div>

              {/* User Name and Role */}
              <div className="text-center">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-darkBoxSub rounded-lg px-3 py-2 text-white text-xl text-center montserrat-medium mb-2 w-full focus:outline-none focus:ring-2 focus:ring-[#F2D543]"
                    placeholder="Enter your name"
                  />
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
                <div className="flex items-center gap-3">
                  <div className="bg-darkBoxSub p-2 rounded-lg">
                    <Mail size={18} className="text-[#F2D543]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 montserrat-light text-sm">
                      Email
                    </p>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="bg-darkBoxSub rounded-lg px-3 py-2 text-white montserrat-regular w-full focus:outline-none focus:ring-2 focus:ring-[#F2D543]"
                        placeholder="Enter your email"
                      />
                    ) : (
                      <p className="text-white montserrat-regular">
                        {user?.data?.email || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <div className="bg-darkBoxSub p-2 rounded-lg">
                    <Phone size={18} className="text-[#F2D543]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 montserrat-light text-sm">
                      Phone
                    </p>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="bg-darkBoxSub rounded-lg px-3 py-2 text-white montserrat-regular w-full focus:outline-none focus:ring-2 focus:ring-[#F2D543]"
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-white montserrat-regular">
                        {user?.data?.phone || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
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
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
