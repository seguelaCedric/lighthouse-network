"use client";

import * as React from "react";
import { User, Mail, Phone, Ship, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientSignOut } from "@/lib/auth/client-actions";

export default function SettingsPage() {
  const handleSignOut = async () => {
    await clientSignOut();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <h1 className="text-4xl font-serif font-semibold text-navy-800">Settings</h1>
          <p className="mt-1 text-gray-500">Manage your account and preferences</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        {/* Account Section */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-navy-900">Account</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500">
              Your account is managed by your recruitment agency. Contact them to update
              your portal access or account details.
            </p>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-navy-900">Notifications</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="font-medium text-navy-900">New shortlist notifications</p>
                <p className="text-sm text-gray-500">
                  Get notified when candidates are shortlisted for your positions
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gold-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gold-300" />
              </label>
            </div>
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="font-medium text-navy-900">Interview reminders</p>
                <p className="text-sm text-gray-500">
                  Receive reminders before scheduled interviews
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gold-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gold-300" />
              </label>
            </div>
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="font-medium text-navy-900">Weekly digest</p>
                <p className="text-sm text-gray-500">
                  Weekly summary of your recruitment activity
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gold-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gold-300" />
              </label>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-navy-900">Security</h2>
          </div>
          <div className="p-6">
            <p className="mb-4 text-sm text-gray-500">
              You're signed in using a secure magic link. Each time you sign in, a new
              login link will be sent to your registered email.
            </p>
            <Button
              variant="secondary"
              onClick={handleSignOut}
              leftIcon={<LogOut className="size-4" />}
              className="text-error-600 border-error-200 hover:bg-error-50"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Support Section */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-navy-900">Support</h2>
          </div>
          <div className="p-6">
            <p className="mb-4 text-sm text-gray-500">
              Need help with your account or have questions about the platform?
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" leftIcon={<Mail className="size-4" />}>
                Contact Support
              </Button>
              <Button variant="ghost">View Help Center</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
