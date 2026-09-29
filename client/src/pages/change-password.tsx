import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import "./change-password.css";

export default function ChangePasswordPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/change-password", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "The password could not be changed.");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/account");
    },
    onError: (error: Error) => {
      toast({ title: "Unable to change password", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Required fields", description: "Please complete all fields", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "At least 6 characters are required", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Password confirmation failed", description: "The new passwords do not match", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <main className="cp-password-page">
      <div className="cp-password-screen">
        <header className="cp-password-header">
          <button
            onClick={() => navigate("/account")}
            className="cp-password-back"
            data-testid="button-back"
          >
            <ChevronLeft aria-hidden="true" />
            <span>Back</span>
          </button>
          <h1>Change password</h1>
        </header>

        <form
          className="cp-password-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="cp-password-group">
            <label htmlFor="current-password">Current password</label>
            <div className="cp-password-field">
              <input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                data-testid="input-current-password"
              />
              <button
                type="button"
                className="cp-password-visibility"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
              >
                {showCurrent ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="cp-password-group">
            <label htmlFor="new-password">New password</label>
            <div className="cp-password-field">
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
              <button
                type="button"
                className="cp-password-visibility"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="cp-password-group">
            <label htmlFor="confirm-password">Confirm password</label>
            <div className="cp-password-field">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
              />
              <button
                type="button"
                className="cp-password-visibility"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
              >
                {showConfirm ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="cp-password-submit"
            data-testid="button-change-password-submit"
          >
            {changePasswordMutation.isPending ? (
              <span className="cp-password-loading">
                <Loader2 aria-hidden="true" />
                Saving...
              </span>
            ) : (
              "Confirm"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
