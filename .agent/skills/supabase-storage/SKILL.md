---
name: supabase-storage
description: Supabase Storage patterns for ValoHub. Use when uploading files, managing avatars, team logos, or any file storage operations. Covers buckets, policies, and signed URLs.
metadata:
  author: valohub-team
  version: "1.0"
---

# Supabase Storage Guide

Guide for file uploads, image handling, and storage management in ValoHub.

## Buckets Overview

| Bucket | Purpose | Access |
|--------|---------|--------|
| `avatars` | User profile pictures | Public read, owner write |
| `team-logos` | Team logos and banners | Public read, captain/coach write |
| `tournament-assets` | Tournament images | Public read, organizer write |

## Upload Patterns

### Basic Upload

```typescript
import { supabase } from '@/lib/supabase';

interface UploadResult {
  path: string;
  publicUrl: string;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<UploadResult> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Replace if exists
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  };
}
```

### Avatar Upload Hook

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function useAvatarUpload(userId: string) {
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    // Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Поддерживаются только JPEG, PNG и WebP');
      return null;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Максимальный размер файла: 2MB');
      return null;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', userId);

      toast.success('Аватар обновлён');
      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки аватара');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploading };
}
```

### Team Logo Upload

```typescript
export async function uploadTeamLogo(
  teamId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${teamId}/logo.${fileExt}`;

  const { error } = await supabase.storage
    .from('team-logos')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from('team-logos')
    .getPublicUrl(filePath);

  // Update team record
  await supabase
    .from('teams')
    .update({ logo_url: data.publicUrl })
    .eq('id', teamId);

  return data.publicUrl;
}
```

## Image Processing

### Resize with Transform

```typescript
// Get resized image URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(path, {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover', // 'contain' | 'cover' | 'fill'
    },
  });
```

### Avatar Component with Fallback

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserAvatarProps {
  user: {
    avatar_url: string | null;
    username: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const initials = user.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage
        src={user.avatar_url ?? undefined}
        alt={user.username}
      />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
```

## Storage Policies (SQL)

### Avatars Bucket

```sql
-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### Team Logos Bucket

```sql
-- Policy: Team leaders can upload logo
CREATE POLICY "Team leaders can upload logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM team_members
    WHERE user_id = auth.uid()
    AND role IN ('captain', 'coach')
  )
);
```

## Delete Files

```typescript
export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
}

// Delete old avatar before uploading new
export async function replaceAvatar(userId: string, newFile: File) {
  // List existing files
  const { data: files } = await supabase.storage
    .from('avatars')
    .list(userId);

  // Delete existing
  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('avatars').remove(paths);
  }

  // Upload new
  return uploadAvatar(userId, newFile);
}
```

## Best Practices

1. **Always validate** file type and size on client AND server
2. **Use `upsert: true`** for replaceable files (avatars, logos)
3. **Organize by ID** — Use `{entity_id}/{filename}` pattern
4. **Set cache control** — Optimize delivery performance
5. **Handle errors** — Show user-friendly messages
6. **Clean up** — Delete old files when replacing
