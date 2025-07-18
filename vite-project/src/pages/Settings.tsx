import React, { useState } from "react";
import {
  signOut,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Settings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || "");

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
      showMessage("Error signing out. Please try again.", "error");
    }
  };

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;

    setIsLoading(true);
    try {
      await updateProfile(user, {
        displayName: newName.trim(),
      });
      showMessage("Name updated successfully!", "success");
      setEditingName(false);
    } catch (error) {
      showMessage("Error updating name. Please try again.", "error");
      console.error("Update name error:", error);
      setNewName(user.displayName || ""); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelNameEdit = () => {
    setNewName(user?.displayName || "");
    setEditingName(false);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      showMessage("Password reset email sent! Check your inbox.", "success");
    } catch (error) {
      showMessage("Error sending reset email. Please try again.", "error");
      console.error("Password reset error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Need to reauthenticate before deletion
      if (user.providerData[0]?.providerId === "google.com") {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      } else {
        if (!deletePassword) {
          showMessage("Password required for account deletion", "error");
          setIsLoading(false);
          return;
        }
        const credential = EmailAuthProvider.credential(
          user.email!,
          deletePassword
        );
        await reauthenticateWithCredential(user, credential);
      }

      await deleteUser(user);
      navigate("/");
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        showMessage("Incorrect password", "error");
      } else if (error.code === "auth/popup-closed-by-user") {
        showMessage("Authentication cancelled", "error");
      } else {
        showMessage("Error deleting account. Please try again.", "error");
      }
      console.error("Delete account error:", error);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setDeletePassword("");
    }
  };

  const isGoogleUser = user?.providerData[0]?.providerId === "google.com";

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Please sign in to access settings
          </p>
          <Button onClick={() => navigate("/login")}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Account Information Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Name</span>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                    maxLength={50}
                  />
                  <Button
                    onClick={handleUpdateName}
                    disabled={
                      isLoading ||
                      !newName.trim() ||
                      newName.trim() === user?.displayName
                    }
                    size="sm"
                    className="text-xs"
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelNameEdit}
                    size="sm"
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">
                    {user.displayName || "No name set"}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setEditingName(true)}
                    size="sm"
                    className="text-xs hover:text-blue-600"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Email</span>
              <span className="text-gray-900">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-medium text-gray-700">Sign-in method</span>
              <span className="text-gray-900 flex items-center">
                {isGoogleUser ? (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </>
                ) : (
                  "Email/Password"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Security Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Security</h2>
          <div className="space-y-4">
            {/* Password Reset - only for email/password users */}
            {!isGoogleUser && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <h3 className="font-medium text-gray-900">Password</h3>
                  <p className="text-sm text-gray-600">
                    Send a password reset email to your account
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handlePasswordReset}
                  disabled={isLoading}
                  className="hover:text-blue-600"
                >
                  {isLoading ? "Sending..." : "Reset Password"}
                </Button>
              </div>
            )}

            {/* Sign Out */}
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="font-medium text-gray-900">Log out</h3>
                <p className="text-sm text-gray-600">
                  Log out of your current session
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="hover:text-gray-600"
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Danger Zone
          </h2>

          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="font-medium text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Delete Account
              </Button>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="mb-4">
                <h3 className="font-medium text-red-800 mb-2">
                  Are you absolutely sure?
                </h3>
                <p className="text-sm text-red-700">
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from our servers.
                </p>
              </div>

              {/* Password input for email/password users */}
              {!isGoogleUser && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-red-700 mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isLoading || (!isGoogleUser && !deletePassword)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isLoading ? "Deleting..." : "Yes, Delete My Account"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                  }}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {message && (
          <div
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              messageType === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center">
              {messageType === "success" ? (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
