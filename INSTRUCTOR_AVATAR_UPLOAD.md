# Instructor Avatar Upload Feature

## Summary

Changed instructor avatar from **URL input** to **file upload** for easier image management.

---

## What Changed

### Before:
- Instructor avatar required pasting an image URL
- Users had to host images elsewhere first
- Inconvenient for uploading facilitator photos

### After:
- ✅ **Upload button** - Click to select image from computer
- ✅ **Automatic compression** - Images compressed to save bandwidth
- ✅ **Preview** - See uploaded avatar immediately
- ✅ **Stored in Supabase** - Images stored in courses bucket

---

## How It Works

### For Users:
1. Go to **Dashboard → Courses → Create New Course**
2. Fill in course details and **save as draft first** (to get course ID)
3. Scroll to **Instructor Details** section
4. Click **"Upload Avatar"** button
5. Select instructor photo from computer
6. Image automatically compresses and uploads
7. Preview appears next to the button
8. Continue editing or publish course

### Technical Details:
- **Storage location**: `courses/instructors/{courseId}/{timestamp}.{ext}`
- **Compression**: Max 0.3MB, max 800px width/height
- **Formats supported**: JPG, PNG, WebP, GIF
- **Bucket**: Supabase `courses` bucket (same as course thumbnails)

---

## File Modified

**src/pages/CourseBuilderPage.tsx**

### Changes Made:

1. **Added new state and ref:**
   ```typescript
   const [uploadingAvatar, setUploadingAvatar] = useState(false);
   const avatarRef = useRef<HTMLInputElement>(null);
   ```

2. **Added upload handler:**
   ```typescript
   const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     // Compresses image to max 0.3MB, 800px
     // Uploads to courses/instructors/{courseId}/
     // Sets instructorAvatar state with public URL
   }
   ```

3. **Replaced URL input with upload button:**
   - Hidden file input
   - Upload button with loading state
   - Preview thumbnail when uploaded
   - Warning if course not saved yet

---

## UI Changes

### Instructor Details Section:

**Before:**
```
┌─────────────────────────────────────┐
│ Avatar Image URL                    │
│ ┌─────────────────────────────────┐ │
│ │ https://...                     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────┐
│ Instructor Avatar                   │
│ ┌──────────────────┐  ┌──────────┐ │
│ │ [+] Upload Avatar│  │  [IMG]   │ │
│ └──────────────────┘  └──────────┘ │
│ Avatar uploaded successfully        │
└─────────────────────────────────────┘
```

---

## Features

### ✅ Automatic Compression
- Images compressed client-side before upload
- Max size: 0.3MB (smaller than course thumbnails)
- Max dimensions: 800x800px
- Saves bandwidth and storage

### ✅ Preview
- Shows uploaded avatar next to button
- 80x80px rounded preview
- Updates immediately after upload

### ✅ Loading State
- Button shows "Uploading..." with spinner
- Disabled during upload
- Prevents double-uploads

### ✅ Validation
- Must save course as draft first
- Shows warning if course ID not available
- Accepts common image formats

### ✅ Error Handling
- Shows error toast if upload fails
- Clears file input for retry
- Doesn't break form if upload fails

---

## Storage Structure

```
courses/
├── thumbnails/
│   └── {courseId}/
│       └── {timestamp}.jpg  (course images)
└── instructors/
    └── {courseId}/
        └── {timestamp}.jpg  (instructor avatars) ← NEW
```

---

## Testing Checklist

### Quick Test (5 minutes):

1. **Create New Course:**
   - [ ] Go to Dashboard → Courses → Create New Course
   - [ ] Fill in title and instructor name
   - [ ] Try to upload avatar (should show warning)
   - [ ] Click "Save as Draft"
   - [ ] Now try to upload avatar (should work)

2. **Upload Avatar:**
   - [ ] Click "Upload Avatar" button
   - [ ] Select an image file
   - [ ] Verify loading spinner appears
   - [ ] Verify success toast appears
   - [ ] Verify preview shows uploaded image

3. **Change Avatar:**
   - [ ] Click "Change Avatar" button
   - [ ] Select different image
   - [ ] Verify preview updates

4. **Edit Existing Course:**
   - [ ] Edit a course that already has an avatar URL
   - [ ] Verify old URL still works
   - [ ] Upload new avatar
   - [ ] Verify it replaces the old one

5. **Publish Course:**
   - [ ] Upload avatar
   - [ ] Publish course
   - [ ] View course detail page
   - [ ] Verify avatar displays correctly

---

## Backward Compatibility

### ✅ Existing Courses:
- Courses with URL-based avatars still work
- No migration needed
- Can upload new avatar to replace URL

### ✅ Database:
- No schema changes
- Still stores URL in `instructor_avatar` field
- Just changes how URL is generated (upload vs paste)

---

## Benefits

### For Users:
- ✅ **Easier** - No need to host images elsewhere
- ✅ **Faster** - Upload directly from computer
- ✅ **Better UX** - See preview immediately
- ✅ **Professional** - Compressed, optimized images

### For Platform:
- ✅ **Consistent** - All images in one place
- ✅ **Optimized** - Automatic compression
- ✅ **Controlled** - Manage storage centrally
- ✅ **Secure** - Uses Supabase RLS policies

---

## Storage Considerations

### Image Sizes:
- **Course thumbnail**: Max 0.5MB, 1280px
- **Instructor avatar**: Max 0.3MB, 800px (smaller)

### Storage Costs:
- Supabase free tier: 1GB storage
- Compressed avatars: ~50-150KB each
- Can store ~6,000-20,000 avatars in 1GB

### Cleanup:
- Old avatars remain in storage when replaced
- Consider adding cleanup job in future
- Not critical for now (small file sizes)

---

## Future Enhancements

### Phase 2 (Optional):
1. **Crop Tool** - Let users crop/resize before upload
2. **Drag & Drop** - Drag image onto upload area
3. **Multiple Instructors** - Support co-instructors with multiple avatars
4. **Avatar Library** - Reuse avatars across courses
5. **Cleanup Job** - Delete old avatars when replaced

---

## Deployment

### Ready to Deploy: ✅ YES

**Risk Level:** 🟢 Low
- No database changes
- No API changes
- Uses existing storage bucket
- Backward compatible

### Deployment Steps:
```bash
# 1. Commit changes
git add src/pages/CourseBuilderPage.tsx
git commit -m "feat: Add instructor avatar upload functionality"

# 2. Push to production
git push origin main
```

---

## Rollback Plan

If issues occur:

```bash
# Quick revert
git revert HEAD
git push
```

Or manually restore the URL input field.

---

## FAQ

**Q: Do I need to save the course before uploading avatar?**
A: Yes, save as draft first. This creates a course ID needed for storage path.

**Q: What happens to old URL-based avatars?**
A: They continue to work. You can upload a new one to replace it.

**Q: Can I still paste a URL if I want?**
A: No, the URL input was replaced with upload button. But you can upload any image.

**Q: What image formats are supported?**
A: JPG, PNG, WebP, GIF - all common formats.

**Q: Is there a file size limit?**
A: Images are automatically compressed to max 0.3MB.

**Q: Where are images stored?**
A: In Supabase Storage, `courses` bucket, `instructors/` folder.

---

## Status

- ✅ Code changes complete
- ✅ TypeScript compilation successful
- ✅ No errors or warnings
- ✅ Backward compatible
- ✅ Ready for testing
- ✅ Ready for deployment

---

**Created:** [Current Date]  
**Modified Files:** 1  
**Risk Level:** 🟢 Low  
**Testing Time:** 5 minutes  
**Deployment Time:** 1 minute  
