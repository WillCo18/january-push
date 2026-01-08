import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Profile {
  id: string;
  nickname: string | null;
  email: string | null;
  avatar_url: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nickname, email, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return null;
    
    setUploading(true);
    
    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be less than 5MB");
      }

      // Create a unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : null);
      
      toast.success("Profile picture updated!");
      return avatarUrl;
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      toast.error(err.message || "Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    profile,
    loading,
    uploading,
    uploadAvatar,
    refetch: fetchProfile,
  };
};
