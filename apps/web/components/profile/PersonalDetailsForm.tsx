"use client";

import * as React from "react";
import {
  Cigarette,
  CigaretteOff,
  Coffee,
  Sparkles,
  Heart,
  Users,
  User,
  UserCheck,
  HelpCircle,
  Check,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import { SelectInput } from "@/components/ui/SelectInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadTattooImage, deleteTattooImage, getTattooImages } from "@/app/crew/profile/actions";

// Position options - will be provided by parent component
interface PositionOption {
  value: string;
  label: string;
}

interface PersonalDetailsFormProps {
  // Personal detail fields
  smoker: string;
  setSmoker: (value: string) => void;
  hasTattoos: string;
  setHasTattoos: (value: string) => void;
  tattooLocation: string;
  setTattooLocation: (value: string) => void;
  maritalStatus: string;
  setMaritalStatus: (value: string) => void;
  couplePosition: string;
  setCouplePosition: (value: string) => void;
  partnerName: string;
  setPartnerName: (value: string) => void;
  partnerPosition: string;
  setPartnerPosition: (value: string) => void;
  positionOptions: PositionOption[];
  error?: string;
}

// Custom toggle button component for better visual design
function ToggleOption({
  selected,
  onClick,
  icon: Icon,
  label,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
        "hover:border-gold-300 hover:bg-gold-50/50",
        selected
          ? "border-gold-500 bg-gold-50 shadow-sm"
          : "border-gray-200 bg-white"
      )}
    >
      {selected && (
        <div className="absolute right-2 top-2">
          <Check className="size-4 text-gold-600" />
        </div>
      )}
      {Icon && (
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            selected ? "bg-gold-100 text-gold-600" : "bg-gray-100 text-gray-500"
          )}
        >
          <Icon className="size-5" />
        </div>
      )}
      <span
        className={cn(
          "text-sm font-medium",
          selected ? "text-gold-700" : "text-gray-700"
        )}
      >
        {label}
      </span>
      {description && (
        <span className="text-xs text-gray-500">{description}</span>
      )}
    </button>
  );
}

// Tattoo Image Upload Component
function TattooImageUpload() {
  const [images, setImages] = React.useState<Array<{ id: string; name: string; fileUrl: string; uploadedAt: string }>>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load existing tattoo images
  React.useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const tattooImages = await getTattooImages();
      setImages(tattooImages);
    } catch (error) {
      console.error("Error loading tattoo images:", error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file type. Please use JPG, PNG, or WebP");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError("File too large. Maximum size is 5MB");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const result = await uploadTattooImage(formData);
      if (result.success) {
        await loadImages(); // Reload images
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setUploadError(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("An error occurred while uploading");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this tattoo image?")) return;

    setDeletingId(imageId);
    try {
      const result = await deleteTattooImage(imageId);
      if (result.success) {
        await loadImages(); // Reload images
      } else {
        alert(result.error || "Failed to delete image");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
      <label className="mb-3 block text-sm font-medium text-amber-800">
        Upload Tattoo Photos (Optional)
      </label>
      <p className="mb-4 text-xs text-amber-600">
        Upload photos of your visible tattoos. This helps us match you with placements where tattoos are acceptable.
      </p>

      {/* Upload Button */}
      <div className="mb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? "Uploading..." : "Upload Photo"}
        </Button>
        {uploadError && (
          <p className="mt-2 text-xs text-red-600">{uploadError}</p>
        )}
      </div>

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-amber-200 bg-gray-100">
                <img
                  src={image.fileUrl}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(image.id)}
                disabled={deletingId === image.id}
                className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                aria-label="Delete image"
              >
                {deletingId === image.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <X className="size-3" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !isUploading && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <ImageIcon className="size-8 text-amber-300 mb-2" />
          <p className="text-xs text-amber-600">No photos uploaded yet</p>
        </div>
      )}
    </div>
  );
}

// Section card wrapper for visual grouping
function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-navy-100 text-navy-600">
          <Icon className="size-5" />
        </div>
        <div>
          <h3 className="font-medium text-navy-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function PersonalDetailsForm({
  smoker,
  setSmoker,
  hasTattoos,
  setHasTattoos,
  tattooLocation,
  setTattooLocation,
  maritalStatus,
  setMaritalStatus,
  couplePosition,
  setCouplePosition,
  partnerName,
  setPartnerName,
  partnerPosition,
  setPartnerPosition,
  positionOptions,
  error,
}: PersonalDetailsFormProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-navy-900">Personal Details</h2>
        <p className="mt-1 text-sm text-gray-500">
          Additional information that helps match you with the right opportunities
        </p>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Lifestyle Section */}
      <SectionCard
        title="Lifestyle"
        description="Preferences that may affect placement"
        icon={Coffee}
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Smoker */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Smoking Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ToggleOption
                selected={smoker === "no"}
                onClick={() => setSmoker("no")}
                icon={CigaretteOff}
                label="Non-Smoker"
              />
              <ToggleOption
                selected={smoker === "social"}
                onClick={() => setSmoker("social")}
                icon={Coffee}
                label="Social Only"
              />
              <ToggleOption
                selected={smoker === "yes"}
                onClick={() => setSmoker("yes")}
                icon={Cigarette}
                label="Smoker"
              />
            </div>
          </div>

          {/* Tattoos */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Visible Tattoos
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ToggleOption
                selected={hasTattoos === "no"}
                onClick={() => setHasTattoos("no")}
                icon={UserCheck}
                label="No Visible Tattoos"
              />
              <ToggleOption
                selected={hasTattoos === "yes"}
                onClick={() => setHasTattoos("yes")}
                icon={Sparkles}
                label="Has Visible Tattoos"
              />
            </div>
            {hasTattoos === "yes" && (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <label className="mb-2 block text-sm font-medium text-amber-800">
                    Please describe location(s)
                  </label>
                  <TextInput
                    value={tattooLocation}
                    onChange={setTattooLocation}
                    placeholder="e.g., Small tattoo on forearm, wrist tattoo"
                  />
                  <p className="mt-2 text-xs text-amber-600">
                    This information helps us find placements where visible tattoos are acceptable.
                  </p>
                </div>

                {/* Tattoo Image Upload Section */}
                <TattooImageUpload />
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Relationship Status Section */}
      <SectionCard
        title="Relationship Status"
        description="For couple placements and household positions"
        icon={Heart}
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Marital Status */}
          <FormField label="Current Status">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: "single", label: "Single", icon: User },
                { value: "partnered", label: "In Relationship", icon: Heart },
                { value: "married", label: "Married", icon: Users },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMaritalStatus(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all",
                    "hover:border-gold-300 hover:bg-gold-50/50",
                    maritalStatus === option.value
                      ? "border-gold-500 bg-gold-50"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <option.icon
                    className={cn(
                      "size-5",
                      maritalStatus === option.value
                        ? "text-gold-600"
                        : "text-gray-400"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      maritalStatus === option.value
                        ? "text-gold-700"
                        : "text-gray-600"
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </FormField>

          {/* Couple Position */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Seeking Couple Position?
              </label>
              <div className="group relative">
                <HelpCircle className="size-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-navy-900 p-3 text-xs text-white shadow-lg group-hover:block z-10">
                  A couple position means you and your partner would both be employed by the same principal/yacht.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ToggleOption
                selected={couplePosition === "no"}
                onClick={() => setCouplePosition("no")}
                icon={User}
                label="Individual Only"
              />
              <ToggleOption
                selected={couplePosition === "yes"}
                onClick={() => setCouplePosition("yes")}
                icon={Users}
                label="As a Couple"
              />
              <ToggleOption
                selected={couplePosition === "flexible"}
                onClick={() => setCouplePosition("flexible")}
                icon={HelpCircle}
                label="Flexible"
              />
            </div>

            {/* Partner Details */}
            {couplePosition === "yes" && (
              <div className="mt-4 rounded-xl border border-gold-200 bg-gradient-to-br from-gold-50 to-amber-50 p-5">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gold-800">
                  <Users className="size-4" />
                  Partner Information
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gold-800">
                      Partner's Name
                    </label>
                    <TextInput
                      value={partnerName}
                      onChange={setPartnerName}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gold-800">
                      Partner's Position
                    </label>
                    <SelectInput
                      value={partnerPosition}
                      onChange={setPartnerPosition}
                      options={positionOptions}
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs text-gold-600">
                  We'll match you both to opportunities that accommodate couples.
                </p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
