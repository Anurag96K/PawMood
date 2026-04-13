-- INSTRUCTIONS:
-- 1. Replace 'YOUR_USER_ID_HERE' with your actual Supabase User ID (from the 'auth.users' table or app profile).
-- 2. Replace 'YOUR_IMAGE_URL_HERE' with the public URL or storage path of your photo.
-- 3. Replace '2023-10-25 12:00:00' with the specific date and time you want this entry to appear on.
-- 4. Run this script in your Supabase SQL Editor.

INSERT INTO mood_entries (
    user_id,
    image_url,
    mood,
    mood_emoji,
    mood_description,
    confidence,
    care_tip,
    analyzed_at
) VALUES (
    'YOUR_USER_ID_HERE',                          -- The user this entry belongs to
    'YOUR_IMAGE_URL_HERE',                        -- Link to the photo (can be a Supabase Storage URL)
    'Happy',                                      -- Mood (Happy, Sad, Angry, etc.)
    '😊',                                         -- Emoji representing the mood
    'Looks like a very happy pet!',               -- Detailed description
    100,                                          -- Confidence score (0-100)
    'Keep up the great work!',                    -- Care tip
    '2023-10-25 12:00:00'::timestamp with time zone -- THE IMPORTANT PART: The past date for the calendar
);
