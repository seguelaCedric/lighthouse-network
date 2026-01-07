"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  buildSignatureHtml,
  buildSignatureText,
  type SignatureSettings as SignatureSettingsData,
} from "@/lib/signatures/template";
import {
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  Save,
  UploadCloud,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  bio: string;
  languages: string | null;
  email: string | null;
  phone_number: string | null;
  image_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  sort_order: number;
  is_active: boolean;
}

interface TeamMemberForm {
  first_name: string;
  last_name: string;
  role: string;
  bio: string;
  languages: string;
  email: string;
  phone_number: string;
  image_url: string;
  linkedin_url: string;
  facebook_url: string;
  is_active: boolean;
}

const emptyForm: TeamMemberForm = {
  first_name: "",
  last_name: "",
  role: "",
  bio: "",
  languages: "",
  email: "",
  phone_number: "",
  image_url: "",
  linkedin_url: "",
  facebook_url: "",
  is_active: true,
};

export default function TeamMembersSettingsPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TeamMemberForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasReordered, setHasReordered] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [signatureSettings, setSignatureSettings] = useState<SignatureSettingsData>({
    logo_url: null,
    logo_width: 140,
  });

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/team-members", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load team members");
      }

      setTeamMembers(payload.teamMembers || []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load team members";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSignatureSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/signature-settings", { cache: "no-store" });
      const payload = await response.json();

      if (response.ok && payload.settings) {
        setSignatureSettings(payload.settings);
      }
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    void loadMembers();
    void loadSignatureSettings();
  }, [loadMembers, loadSignatureSettings]);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (member: TeamMember) => {
    if (!member.id) {
      setError("Unable to edit this member (missing id). Refresh and try again.");
      return;
    }
    setEditingId(member.id);
    const derivedFirst = member.first_name ?? member.name.split(" ")[0] ?? "";
    const derivedLast = member.last_name ?? member.name.split(" ").slice(1).join(" ") ?? "";
    setFormState({
      first_name: derivedFirst,
      last_name: derivedLast,
      role: member.role,
      bio: member.bio,
      languages: member.languages ?? "",
      email: member.email ?? "",
      phone_number: member.phone_number ?? "",
      image_url: member.image_url ?? "",
      linkedin_url: member.linkedin_url ?? "",
      facebook_url: member.facebook_url ?? "",
      is_active: member.is_active,
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm("Remove this team member?") || saving) return;
    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/admin/team-members/${memberId}`, {
        method: "DELETE",
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete team member");
      }

      await loadMembers();
      if (editingId === memberId) {
        resetForm();
      }
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete team member";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      setError(null);

      const isEditing = Boolean(editingId);
      const isValidUuid = (value: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value
        );

      if (isEditing && (!editingId || !isValidUuid(editingId))) {
        throw new Error("Missing team member id. Close and re-open the modal.");
      }

      const payload = {
        id: editingId,
        first_name: formState.first_name.trim(),
        last_name: formState.last_name.trim(),
        role: formState.role.trim(),
        bio: formState.bio.trim(),
        languages: formState.languages.trim(),
        email: formState.email.trim(),
        phone_number: formState.phone_number.trim(),
        image_url: formState.image_url.trim(),
        linkedin_url: formState.linkedin_url.trim(),
        facebook_url: formState.facebook_url.trim(),
        is_active: formState.is_active,
      };

      if (!payload.first_name || !payload.last_name || !payload.role || !payload.bio || !payload.image_url) {
        throw new Error("First name, last name, role, bio, and image are required.");
      }

      const response = await fetch(
        isEditing ? `/api/admin/team-members/${editingId}` : "/api/admin/team-members",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        const detail = data?.details ? ` (${data.details})` : "";
        throw new Error((data?.error || "Failed to save team member") + detail);
      }

      await loadMembers();
      resetForm();
      setModalOpen(false);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save team member";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file || uploadingImage) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadingImage(true);
      setError(null);
      const response = await fetch("/api/admin/team-members/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload image");
      }

      setFormState((prev) => ({
        ...prev,
        image_url: data.imageUrl,
      }));
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Failed to upload image";
      setError(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...teamMembers];
    const [dragged] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, dragged);

    setTeamMembers(updated);
    setDraggedIndex(index);
    setHasReordered(true);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    if (!hasReordered) return;

    try {
      setSavingOrder(true);
      const response = await fetch("/api/admin/team-members/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: teamMembers.map((member) => member.id) }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to save order");
      }

      setHasReordered(false);
    } catch (reorderError) {
      const message = reorderError instanceof Error ? reorderError.message : "Failed to save order";
      setError(message);
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-navy-900">About Page Team</h2>
          <p className="text-sm text-gray-500">
            Manage the team members shown on the public About page.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleAdd} disabled={saving}>
          <Plus className="mr-2 size-4" />
          Add team member
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-navy-900">Current order</h3>
              <p className="text-sm text-gray-500">Drag cards to reorder.</p>
            </div>
            {savingOrder && <span className="text-xs text-gray-400">Saving order...</span>}
          </div>

          <div className="mt-4 space-y-3">
            {loading && (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                Loading team members...
              </div>
            )}

            {!loading && teamMembers.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                No team members yet.
              </div>
            )}

            {teamMembers.map((member, index) => (
              <div
                key={member.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  handleDragOver(index);
                }}
                className={cn(
                  "flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-3 py-3 transition",
                  draggedIndex === index && "border-gold-300 bg-gold-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", member.id);
                      handleDragStart(index);
                    }}
                    onDragEnd={handleDragEnd}
                    aria-label={`Reorder ${member.name}`}
                  >
                    <GripVertical className="size-4 text-gray-400" />
                  </div>
                  <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-gray-100">
                    {member.image_url && (
                      <Image
                        src={member.image_url}
                        alt={member.name}
                        fill
                        className="object-cover object-top"
                      />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-navy-900">
                    {member.first_name || member.last_name
                      ? `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim()
                      : member.name}
                  </p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    member.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {member.is_active ? "Active" : "Hidden"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(member)}
                    className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                    aria-label={`Edit ${member.name}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(member.id)}
                    className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                    aria-label={`Delete ${member.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Dialog
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open && !saving) {
              resetForm();
            }
          }}
        >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit team member" : "Add team member"}
              </DialogTitle>
              <DialogDescription>
                Update text, photos, and visibility for the About page.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-3">
                  <label className="text-sm font-medium text-gray-700">First name</label>
                  <Input
                    value={formState.first_name}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, first_name: event.target.value }))
                    }
                    placeholder="First name"
                  />
                </div>
                <div className="grid gap-3">
                  <label className="text-sm font-medium text-gray-700">Last name</label>
                  <Input
                    value={formState.last_name}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, last_name: event.target.value }))
                    }
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium text-gray-700">Role / Title</label>
                <Input
                  value={formState.role}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, role: event.target.value }))
                  }
                  placeholder="Department or title"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <Textarea
                  value={formState.bio}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, bio: event.target.value }))
                  }
                  placeholder="Short profile summary"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium text-gray-700">Languages</label>
                <Input
                  value={formState.languages}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, languages: event.target.value }))
                  }
                  placeholder="English, French, Spanish"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="name@lighthouse-careers.com"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium text-gray-700">Phone number</label>
                <Input
                  value={formState.phone_number}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, phone_number: event.target.value }))
                  }
                  placeholder="+33 4 51 08 87 80"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium text-gray-700">Photo</label>
                <div className="flex items-center gap-4">
                <div className="relative h-20 w-16 overflow-hidden rounded-xl bg-gray-100">
                  {formState.image_url && (
                    <Image
                      src={formState.image_url}
                      alt={`${formState.first_name} ${formState.last_name}`.trim() || "Team member"}
                      fill
                      className="object-cover object-top"
                    />
                  )}
                </div>
                  <div className="flex-1">
                    <Input
                      value={formState.image_url}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, image_url: event.target.value }))
                      }
                      placeholder="Paste image URL or upload"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                        <UploadCloud className="size-4" />
                        {uploadingImage ? "Uploading..." : "Upload image"}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void handleUpload(file);
                            }
                          }}
                          disabled={uploadingImage}
                        />
                      </label>
                      <span className="text-xs text-gray-400">JPG/PNG/WebP, 5MB max</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium text-gray-700">LinkedIn URL</label>
                <Input
                  value={formState.linkedin_url}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, linkedin_url: event.target.value }))
                  }
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium text-gray-700">Facebook URL</label>
                <Input
                  value={formState.facebook_url}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, facebook_url: event.target.value }))
                  }
                  placeholder="https://facebook.com/..."
                />
              </div>

              <Checkbox
                checked={formState.is_active}
                onChange={(checked) => setFormState((prev) => ({ ...prev, is_active: checked }))}
                label="Show on About page"
                description="If unchecked, this person is hidden from the public site."
              />

              <SignaturePreview
                settings={signatureSettings}
                member={{
                  first_name: formState.first_name,
                  last_name: formState.last_name,
                  role: formState.role,
                  email: formState.email,
                  phone_number: formState.phone_number,
                  linkedin_url: formState.linkedin_url,
                  facebook_url: formState.facebook_url,
                }}
              />

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSave} disabled={saving || uploadingImage}>
                  <Save className="mr-2 size-4" />
                  {editingId ? "Save changes" : "Create member"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function SignaturePreview({
  settings,
  member,
}: {
  settings: SignatureSettingsData;
  member: {
    first_name: string;
    last_name: string;
    role: string;
    email: string;
    phone_number: string;
    linkedin_url: string;
    facebook_url: string;
  };
}) {
  const signatureHtml = buildSignatureHtml(member, settings);
  const signatureText = buildSignatureText(member);

  const copyPlain = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(signatureText);
  };

  const copyHtml = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(signatureHtml);
  };

  const copyRich = async () => {
    if (typeof window !== "undefined" && "ClipboardItem" in window && navigator.clipboard) {
      const item = new ClipboardItem({
        "text/html": new Blob([signatureHtml], { type: "text/html" }),
        "text/plain": new Blob([signatureText], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      return;
    }
    await copyHtml();
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy-900">Signature preview</p>
          <p className="text-xs text-gray-500">
            Copy for Gmail (rich) or ATS (HTML).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={copyRich}>
            Copy for Gmail
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={copyHtml}>
            Copy HTML (ATS)
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={copyPlain}>
            Copy text
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-gray-500">HTML</label>
        <textarea
          readOnly
          value={signatureHtml}
          className="mt-2 h-32 w-full rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-700"
        />
      </div>
    </div>
  );
}
