"use client";

import * as React from "react";
import { Camera, Upload, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import { SelectInput } from "@/components/ui/SelectInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Button } from "@/components/ui/button";
import { genderOptions, nationalityOptions } from "./constants";
import { updateProfilePhoto } from "@/app/crew/profile/actions";

interface PersonalInfoFormProps {
  // Profile photo
  profilePhotoUrl?: string;
  onPhotoChange?: (newUrl: string) => void;

  // Personal information
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  nationality: string;
  setNationality: (value: string) => void;
  secondNationality: string;
  setSecondNationality: (value: string) => void;

  // Contact information
  phone: string;
  setPhone: (value: string) => void;
  whatsapp: string;
  setWhatsapp: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  currentLocation: string;
  setCurrentLocation: (value: string) => void;
  errors?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nationality?: string;
    phone?: string;
    email?: string;
  };
}

export function PersonalInfoForm({
  profilePhotoUrl,
  onPhotoChange,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  dateOfBirth,
  setDateOfBirth,
  gender,
  setGender,
  nationality,
  setNationality,
  secondNationality,
  setSecondNationality,
  phone,
  setPhone,
  whatsapp,
  setWhatsapp,
  email,
  setEmail,
  currentLocation,
  setCurrentLocation,
  errors,
}: PersonalInfoFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const result = await updateProfilePhoto(formData);

      if (result.success && result.photoUrl) {
        onPhotoChange?.(result.photoUrl);
      } else {
        setUploadError(result.error || "Failed to upload photo");
      }
    } catch {
      setUploadError("An unexpected error occurred");
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">Personal Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Basic personal details and contact information
        </p>
        {errors && Object.keys(errors).length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please complete the highlighted fields before continuing.
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Profile Photo */}
      <div id="photo" className="mb-6 scroll-mt-24">
        <label className="mb-2 block text-sm font-medium text-gray-700">Profile Photo</label>
        <div className="flex items-center gap-6">
          <div className="relative">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={`${firstName} ${lastName}`}
                className="size-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-2xl font-bold text-navy-600">
                {firstName[0]}
                {lastName[0]}
              </div>
            )}
            <button
              type="button"
              onClick={handlePhotoClick}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-gold-500 text-white shadow-md hover:bg-gold-600 disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
            </button>
          </div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              onClick={handlePhotoClick}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Photo"}
            </Button>
            <p className="mt-2 text-xs text-gray-500">
              JPG or PNG, max 5MB. Square photos work best.
            </p>
            {uploadError && (
              <p className="mt-1 text-xs text-red-600">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label="First Name" required error={errors?.firstName}>
          <TextInput
            value={firstName}
            onChange={setFirstName}
            placeholder="Enter first name"
            className={errors?.firstName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : undefined}
          />
        </FormField>

        <FormField label="Last Name" required error={errors?.lastName}>
          <TextInput
            value={lastName}
            onChange={setLastName}
            placeholder="Enter last name"
            className={errors?.lastName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : undefined}
          />
        </FormField>

        <FormField label="Date of Birth" required error={errors?.dateOfBirth}>
          <TextInput
            type="date"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            className={errors?.dateOfBirth ? "border-red-500 focus:border-red-500 focus:ring-red-500" : undefined}
          />
        </FormField>

        <FormField label="Gender">
          <SelectInput
            value={gender}
            onChange={setGender}
            options={[
              { value: "", label: "Select gender..." },
              ...genderOptions,
            ]}
          />
        </FormField>

        <FormField label="Nationality" required error={errors?.nationality}>
          <SearchableSelect
            value={nationality}
            onChange={setNationality}
            options={nationalityOptions}
            placeholder="Select nationality..."
            searchPlaceholder="Type to search nationalities..."
            className={errors?.nationality ? "border-red-500 focus:border-red-500 focus:ring-red-500" : undefined}
          />
        </FormField>

        <FormField label="Second Nationality">
          <SearchableSelect
            value={secondNationality}
            onChange={setSecondNationality}
            options={[{ value: "", label: "None" }, ...nationalityOptions.slice(1)]}
            placeholder="None"
            searchPlaceholder="Type to search nationalities..."
          />
        </FormField>

        <FormField label="Phone Number" required error={errors?.phone}>
          <TextInput
            value={phone}
            onChange={setPhone}
            placeholder="+1 234 567 8900"
            prefix={<Phone className="size-4 text-gray-400" />}
            className={errors?.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : undefined}
          />
        </FormField>

        <FormField label="WhatsApp Number">
          <TextInput
            value={whatsapp}
            onChange={setWhatsapp}
            placeholder="+1 234 567 8900"
          />
        </FormField>

        <FormField label="Email Address" required error={errors?.email}>
          <div className="relative">
            <TextInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="email@example.com"
              prefix={<Mail className="size-4 text-gray-400" />}
              className={errors?.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : undefined}
            />
          </div>
        </FormField>

        <FormField label="Current Location">
          <TextInput
            value={currentLocation}
            onChange={setCurrentLocation}
            placeholder="City, Country"
            prefix={<MapPin className="size-4 text-gray-400" />}
          />
        </FormField>
      </div>
    </div>
  );
}
