"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useUser, useClerk, useSessionList } from "@clerk/nextjs";
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  Laptop,
  Loader2,
  ChevronRight,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogViewport,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { sessions, isLoaded: isSessionsLoaded } = useSessionList();
  const { openUserProfile, signOut } = useClerk();

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Danger zone state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Pre-fill state when user loads
  React.useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setUsername(user.username || "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    setProfileError("");
    try {
      await user.update({
        firstName,
        lastName,
      });
      if (username && username !== user.username) {
        await user.update({ username });
      }
      setIsEditingProfile(false);
    } catch (err: any) {
      setProfileError(err.errors?.[0]?.message || "Unable to update your profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await user.delete();
      await signOut();
    } catch (err: any) {
      setDeleteError("Unable to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  if (!isUserLoaded || !isSessionsLoaded) {
    return (
      <div className="flex flex-col flex-1 p-6 md:p-8 lg:p-10 max-w-screen-md mx-auto w-full gap-12 pb-24 animate-pulse">
         <div className="h-8 w-48 bg-[var(--ds-surface-1)] rounded-md" />
         <div className="h-32 w-full bg-[var(--ds-surface-1)] rounded-md" />
      </div>
    );
  }

  if (!user) return null;

  const primaryEmail = user.primaryEmailAddress?.emailAddress;
  const isEmailVerified = user.primaryEmailAddress?.verification?.status === "verified";
  
  const hasPassword = user.passwordEnabled;
  const hasMfa = user.twoFactorEnabled;
  
  const connectedAccounts = user.externalAccounts || [];
  const activeSessions = sessions?.filter(s => s.status === "active") || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1], staggerChildren: 0.04 }}
      className="flex flex-col flex-1 p-6 md:p-8 lg:p-10 max-w-screen-2xl mx-auto w-full pb-24"
    >
      {/* 1. PROFILE */}
      <motion.div variants={{ initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } }} className="flex flex-col gap-3 pb-8">
        <span className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading px-1">
          Profile
        </span>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 border border-[var(--ds-hairline)] rounded-[var(--ds-rounded-xl)] bg-[var(--ds-surface-0)]">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border border-[var(--ds-hairline)] shadow-sm">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback>{user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-medium text-[var(--ds-ink)] font-heading">
                {user.fullName || "AEGIS User"}
              </span>
              <div className="flex flex-col text-[13px] text-[var(--ds-ink-subtle)]">
                {user.username && <span>@{user.username}</span>}
                <span>{primaryEmail}</span>
              </div>
            </div>
          </div>

          <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
            <DialogTrigger render={<Button variant="outline" size="sm" className="h-8 text-[12px]">Edit profile</Button>} />
            <DialogPortal>
              <DialogBackdrop />
              <DialogViewport>
                <DialogPopup className="w-full max-w-sm bg-[var(--ds-canvas)] border border-[var(--ds-hairline)] rounded-[var(--ds-rounded-md)] p-6 shadow-2xl">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <DialogTitle className="text-[16px] font-semibold text-[var(--ds-ink)] font-heading">Edit profile</DialogTitle>
                      <DialogDescription className="text-[13px] text-[var(--ds-ink-subtle)]">Update your personal information.</DialogDescription>
                    </div>

                    {profileError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-[12px]">
                        {profileError}
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[12px] font-medium text-[var(--ds-ink)]">First name</Label>
                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-9 text-[13px]" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[12px] font-medium text-[var(--ds-ink)]">Last name</Label>
                        <Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-9 text-[13px]" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[12px] font-medium text-[var(--ds-ink)]">Username</Label>
                        <Input value={username} onChange={e => setUsername(e.target.value)} className="h-9 text-[13px]" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                      <DialogClose render={<Button variant="outline" size="sm" className="h-8 text-[12px]">Cancel</Button>} />
                      <Button size="sm" onClick={handleSaveProfile} disabled={isSavingProfile} className="h-8 text-[12px] bg-[var(--ds-primary)] text-white hover:bg-[var(--ds-primary-hover)] border-0">
                        {isSavingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save changes"}
                      </Button>
                    </div>
                  </div>
                </DialogPopup>
              </DialogViewport>
            </DialogPortal>
          </Dialog>
        </div>
      </motion.div>

      {/* 2. ACCOUNT */}
      <motion.div variants={{ initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } }} className="flex flex-col gap-3 pb-8">
        <span className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading px-1">
          Account
        </span>
        
        <div className="flex flex-col border border-[var(--ds-hairline)] rounded-[var(--ds-rounded-xl)] divide-y divide-[var(--ds-hairline)] bg-[var(--ds-surface-0)] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 text-[13px] gap-1 hover:bg-[var(--ds-surface-1)]/50 transition-colors">
            <span className="text-[var(--ds-ink-subtle)] w-1/3 shrink-0">Email</span>
            <div className="flex items-center sm:justify-end gap-3 flex-1 text-[var(--ds-ink)]">
              <span>{primaryEmail}</span>
              {isEmailVerified && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 text-[13px] gap-1 hover:bg-[var(--ds-surface-1)]/50 transition-colors">
            <span className="text-[var(--ds-ink-subtle)] w-1/3 shrink-0">Username</span>
            <span className="text-[var(--ds-ink)] flex-1 sm:text-right">{user.username ? `@${user.username}` : "Not set"}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 text-[13px] gap-1 hover:bg-[var(--ds-surface-1)]/50 transition-colors">
            <span className="text-[var(--ds-ink-subtle)] w-1/3 shrink-0">Account created</span>
            <span className="text-[var(--ds-ink)] flex-1 sm:text-right">
              {new Date(user.createdAt!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 3. SECURITY */}
      <motion.div variants={{ initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } }} className="flex flex-col gap-3 pb-8">
        <span className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading px-1">
          Security
        </span>
        
        <div className="flex flex-col border border-[var(--ds-hairline)] rounded-[var(--ds-rounded-xl)] divide-y divide-[var(--ds-hairline)] bg-[var(--ds-surface-0)] overflow-hidden">
          <button onClick={() => openUserProfile()} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 text-[13px] hover:bg-[var(--ds-surface-1)] transition-colors text-left outline-none focus-visible:bg-[var(--ds-surface-1)] gap-2">
            <div className="flex flex-col gap-0.5 w-1/2 shrink-0">
              <span className="font-medium text-[var(--ds-ink)] group-hover:text-[var(--ds-ink)]">Password</span>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 flex-1 w-full">
               <span className="text-[13px] text-[var(--ds-ink-subtle)]">{hasPassword ? "Password protected" : "No password set"}</span>
               <div className="flex items-center gap-1.5 text-[var(--ds-ink-subtle)] group-hover:text-[var(--ds-ink)] transition-colors shrink-0">
                <span className="text-[12px] font-medium">Manage</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </button>
          
          <button onClick={() => openUserProfile()} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 text-[13px] hover:bg-[var(--ds-surface-1)] transition-colors text-left outline-none focus-visible:bg-[var(--ds-surface-1)] gap-2">
            <div className="flex flex-col gap-0.5 w-1/2 shrink-0">
              <span className="font-medium text-[var(--ds-ink)] group-hover:text-[var(--ds-ink)]">Two-factor authentication</span>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 flex-1 w-full">
              <span className="text-[13px] text-[var(--ds-ink-subtle)]">{hasMfa ? "Enabled" : "Not enabled"}</span>
              <div className="flex items-center gap-1.5 text-[var(--ds-ink-subtle)] group-hover:text-[var(--ds-ink)] transition-colors shrink-0">
                <span className="text-[12px] font-medium">Manage</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </button>
        </div>
      </motion.div>

      {/* 4. CONNECTED ACCOUNTS */}
      <motion.div variants={{ initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } }} className="flex flex-col gap-3 pb-12">
        <span className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading px-1">
          Connected Accounts
        </span>
        
        <div className="flex flex-col border border-[var(--ds-hairline)] rounded-[var(--ds-rounded-xl)] divide-y divide-[var(--ds-hairline)] bg-[var(--ds-surface-0)] overflow-hidden">
          {connectedAccounts.length === 0 ? (
            <div className="p-4 text-[13px] text-[var(--ds-ink-subtle)]">No connected accounts.</div>
          ) : (
            connectedAccounts.map((account) => (
              <button key={account.id} onClick={() => openUserProfile()} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 text-[13px] hover:bg-[var(--ds-surface-1)] transition-colors text-left outline-none focus-visible:bg-[var(--ds-surface-1)] gap-2">
                <div className="flex items-center gap-3 w-1/2">
                  <div className="h-8 w-8 rounded-full bg-[var(--ds-surface-2)] flex items-center justify-center shrink-0 border border-[var(--ds-hairline)]">
                    <Globe className="h-4 w-4 text-[var(--ds-ink)]" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-[var(--ds-ink)] capitalize">{account.provider.replace('oauth_', '')}</span>
                  </div>
                </div>
                 <div className="flex items-center justify-between sm:justify-end gap-3 flex-1 w-full pl-11 sm:pl-0">
                  <span className="text-[13px] text-[var(--ds-ink-subtle)] truncate max-w-[150px] sm:max-w-[200px]">{account.username || account.emailAddress || "Connected"}</span>
                  <div className="flex items-center gap-1.5 text-[var(--ds-ink-subtle)] group-hover:text-[var(--ds-ink)] transition-colors shrink-0">
                    <span className="text-[12px] font-medium">Manage</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>


      {/* 5. DANGER ZONE */}
      <motion.div variants={{ initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } }} className="flex flex-col gap-3">
        <span className="text-[11px] font-bold tracking-widest text-red-500 uppercase font-heading px-1">
          Danger Zone
        </span>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 border border-red-500/20 rounded-[var(--ds-rounded-xl)] bg-red-500/5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-medium text-[var(--ds-ink)]">
              Delete account
            </span>
            <span className="text-[12px] text-[var(--ds-ink-subtle)] max-w-sm">
              Permanently delete your AEGIS account and associated data.
            </span>
          </div>

          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-[12px] font-medium border border-red-500/40 bg-red-500/10 text-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/40 hover:!bg-red-600 hover:!text-white hover:!border-red-600 dark:hover:!bg-red-600 dark:hover:!text-white dark:hover:!border-red-600 [&:hover_*]:!text-white rounded-[var(--ds-rounded-md)] transition-colors shadow-xs shrink-0"
                >
                  Delete account
                </Button>
              }
            />

            <DialogPortal>
              <DialogBackdrop />
              <DialogViewport>
                <DialogPopup className="w-full max-w-md bg-[var(--ds-canvas)] border border-[var(--ds-hairline)] rounded-[var(--ds-rounded-md)] p-6 shadow-2xl">
                  <div className="flex flex-col gap-3">
                    <DialogTitle className="text-[16px] font-semibold text-[var(--ds-ink)] font-heading">
                      Delete your account?
                    </DialogTitle>
                    <DialogDescription className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed">
                      This action cannot be undone. All connected repositories, investigation traces, and verification records will be permanently removed along with your identity.
                    </DialogDescription>

                    {deleteError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-[12px]">
                        {deleteError}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 my-2">
                      <label className="text-[11px] font-medium text-[var(--ds-ink-subtle)]">
                        Type <span className="font-mono font-semibold text-[var(--ds-ink)]">delete my account</span> to confirm:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="delete my account"
                        className="h-8 px-2.5 text-[12px] rounded-[var(--ds-rounded-md)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] text-[var(--ds-ink)] outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                      <DialogClose
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-[12px] rounded-[var(--ds-rounded-md)]"
                          >
                            Cancel
                          </Button>
                        }
                      />
                      <Button
                        disabled={deleteConfirmText !== "delete my account" || isDeleting}
                        onClick={handleDeleteAccount}
                        size="sm"
                        className="h-8 px-3 text-[12px] font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 rounded-[var(--ds-rounded-md)] border-0"
                      >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete account"}
                      </Button>
                    </div>
                  </div>
                </DialogPopup>
              </DialogViewport>
            </DialogPortal>
          </Dialog>
        </div>
      </motion.div>
    </motion.div>
  );
}
