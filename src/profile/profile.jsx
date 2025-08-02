import { useState, useRef } from "react";
import {
  Camera,
  Settings,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { useLoaderData } from "react-router-dom";

function Profile() {
  const { user } = useLoaderData();
  const [profileImage, setProfileImage] = useState(
    user?.data?.profile_image || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("profile_image", file);

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}user/upload-profile-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${
              document.cookie.split("token=")[1]?.split(";")[0]
            }`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setProfileImage(result.data.profile_image_url);
      } else {
        console.error("Error uploading image:", result);
        alert("Error uploading image. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      setIsUploading(false);
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
          <button className="flex items-center gap-2 bg-darkBox hover:bg-darkBoxSub transition-colors px-4 py-2 rounded-lg text-white">
            <Settings size={18} />
            Settings
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Image and Basic Info */}
          <div className="lg:col-span-1">
            <div className="bg-darkBox rounded-2xl p-6">
              {/* Profile Image */}
              <div className="relative mx-auto w-32 h-32 mb-6">
                <div className="w-full h-full rounded-full overflow-hidden bg-darkBoxSub flex items-center justify-center">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} className="text-gray-400" />
                  )}
                </div>

                {/* Upload Button */}
                <button
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 bg-[#F2D543] hover:bg-[#f2f243] transition-colors p-2 rounded-full text-primarioDark disabled:opacity-50"
                >
                  <Camera size={16} />
                </button>

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
                <h2 className="text-white montserrat-medium text-xl mb-2">
                  {user?.data?.name || "User Name"}
                </h2>
                <p className="text-gray-400 montserrat-light text-sm">
                  {user?.data?.role || "Content Creator"}
                </p>
                {isUploading && (
                  <p className="text-[#F2D543] montserrat-light text-xs mt-2">
                    Uploading image...
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
                  <div>
                    <p className="text-gray-400 montserrat-light text-sm">
                      Email
                    </p>
                    <p className="text-white montserrat-regular">
                      {user?.data?.email || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <div className="bg-darkBoxSub p-2 rounded-lg">
                    <Phone size={18} className="text-[#F2D543]" />
                  </div>
                  <div>
                    <p className="text-gray-400 montserrat-light text-sm">
                      Phone
                    </p>
                    <p className="text-white montserrat-regular">
                      {user?.data?.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3">
                  <div className="bg-darkBoxSub p-2 rounded-lg">
                    <MapPin size={18} className="text-[#F2D543]" />
                  </div>
                  <div>
                    <p className="text-gray-400 montserrat-light text-sm">
                      Location
                    </p>
                    <p className="text-white montserrat-regular">
                      {user?.data?.location || "Not provided"}
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
              </div>

              {/* Stats Section */}
              <div className="mt-8 pt-6 border-t border-darkBoxSub">
                <h4 className="text-white montserrat-medium text-lg mb-4">
                  Activity Stats
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-darkBoxSub rounded-lg p-4 text-center">
                    <p className="text-[#F2D543] montserrat-medium text-2xl">
                      {user?.data?.projects_count || 0}
                    </p>
                    <p className="text-gray-400 montserrat-light text-sm">
                      Total Projects
                    </p>
                  </div>

                  <div className="bg-darkBoxSub rounded-lg p-4 text-center">
                    <p className="text-[#F2D543] montserrat-medium text-2xl">
                      {user?.data?.completed_projects_count || 0}
                    </p>
                    <p className="text-gray-400 montserrat-light text-sm">
                      Completed
                    </p>
                  </div>

                  <div className="bg-darkBoxSub rounded-lg p-4 text-center">
                    <p className="text-[#F2D543] montserrat-medium text-2xl">
                      {user?.data?.folders_count || 0}
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
