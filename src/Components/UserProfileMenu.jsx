import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEllipsisV, FaUser, FaSignOutAlt, FaTrash } from "react-icons/fa";
import { showToast } from "../Services/Toast";
import { updateProfile, deleteAccount } from "../Services/Api";

export default function UserProfileMenu({ user, onProfileUpdate }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [profilePicture, setProfilePicture] = useState(
    localStorage.getItem("userPicture") || ""
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  // Update name when user prop changes
  useEffect(() => {
    setName(user?.name || "");
  }, [user]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast({
        message: "Please select an image file",
        type: "error",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast({
        message: "Image must be less than 5MB",
        type: "error",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast({
        message: "Name cannot be empty",
        type: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      if (imageFile) {
        formData.append("profilePicture", imageFile);
      }

      const result = await updateProfile(formData);

      if (result.ok) {
        // Update localStorage
        localStorage.setItem("userName", result.user.name);
        if (result.user.profilePicture) {
          localStorage.setItem("userPicture", result.user.profilePicture);
          setProfilePicture(result.user.profilePicture);
        }

        // Notify parent component
        if (onProfileUpdate) {
          onProfileUpdate(result.user);
        }

        showToast({
          message: "Profile updated successfully",
          type: "success",
        });

        setShowSettings(false);
        setImageFile(null);
        setImagePreview(null);
      } else {
        showToast({
          message: result.error || "Failed to update profile",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Profile update error:", err);
      showToast({
        message: "Failed to update profile. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const result = await deleteAccount();

      if (result.ok) {
        showToast({
          message: "Account deleted successfully",
          type: "success",
        });

        // Clear all localStorage
        localStorage.clear();

        // Redirect to home page
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        showToast({
          message: result.error || "Failed to delete account",
          type: "error",
        });
        setDeleting(false);
      }
    } catch (err) {
      console.error("Account deletion error:", err);
      showToast({
        message: "Failed to delete account. Please try again.",
        type: "error",
      });
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    showToast({
      message: "Logged out successfully",
      type: "success",
    });
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const currentPicture = imagePreview || profilePicture;

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Profile Avatar Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 transition-colors"
        >
          {currentPicture ? (
            <img
              src={currentPicture}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-300"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-semibold text-sm">
              {getInitials(user?.name)}
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {currentPicture ? (
                  <img
                    src={currentPicture}
                    alt={user?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center font-semibold text-lg">
                    {getInitials(user?.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setShowSettings(true);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3"
              >
                <FaUser className="text-gray-600" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3"
              >
                <FaSignOutAlt className="text-gray-600" />
                <span>Log out</span>
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-3"
              >
                <FaTrash />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Profile Settings</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {imagePreview || profilePicture ? (
                    <img
                      src={imagePreview || profilePicture}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-sky-600 text-white flex items-center justify-center font-semibold text-3xl">
                      {getInitials(name)}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-sky-600 text-white rounded-full p-2 hover:bg-sky-700 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Click to change profile picture
                </p>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter your name"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSettings(false);
                  setImageFile(null);
                  setImagePreview(null);
                  setName(user?.name || "");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-600">
                Delete Account
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete your account?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. All your chats and data will be
                permanently deleted.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
