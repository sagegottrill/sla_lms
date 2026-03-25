# Connecta LMS - Pre-Launch Testing Guide & System Audit
**For: She Leads Africa (SLA)**

Welcome to the **Connecta LMS** testing environment. The platform has been extensively refactored to support complex course structures, progressive user onboarding, real-time administrative dashboards, and scalable media management.

Please use this guide to seamlessly test the main user journeys and review the critical infrastructure requirements needed before we push the platform to the public. 

---

## 🚀 Part 1: Rapid Testing Walkthrough

This section covers the three primary actions instructors and administrators need to verify:

### 1. Creating an Account & Onboarding
1. Navigate to the **Home Page** and click **Get Started** or **Log In**.
2. Sign up with a new email address and password.
3. You will immediately hit the **Progressive Onboarding Wizard**. 
4. Select your role (e.g., "Student" or "Instructor"), add some skills, and upload an avatar.
5. Once completed, you will be redirected to your personalized **Learner Dashboard**.

### 2. Upgrading a User to an Instructor or Admin
By default, new sign-ups are "Students". To test course creation, you must grant them Instructor or Admin rights.
1. Log into your primary **Administrator Account**.
2. Go to **Admin Dashboard -> User Management**.
3. Find the new user you just created in the directory.
4. Click the three dots (More Actions) on their row and select **Manage Member**.
5. Change their system role from `Student` to `Instructor` or `Admin` and click **Save**.
6. The interface will instantly update without reloading the page. When that user logs in, they will have access to the Instructor tools.

### 3. Creating a Course & Embedding Vimeo Videos
1. Log in as an **Instructor**.
2. Go to **My Courses -> Create New Course**.
3. **Step 1:** Fill out the Course Title, Description, Pricing, and upload an eye-catching thumbnail.
4. **Step 2 (Curriculum):** Create your Modules and Lessons.
   - Click **+ Lesson** inside a module.
   - For a video lesson, you will see a field for a **Vimeo URL**.
   - **How to carry a link from Vimeo:** Go to your completed video on Vimeo, copy the standard URL from your browser (e.g., `https://vimeo.com/12345678`), and paste it into the LMS curriculum builder. The LMS is smart enough to convert standard Vimeo links into beautiful, embedded players automatically!
5. **Step 3 (Publish):** Review the summary and click **Publish Course**. It is now live in the course catalog.

---

## ⚠️ Part 2: Critical Infrastructure & Storage Audit

While the code is flawless and ready, the actual tools running in the background are currently on **Free / Demo Tiers**. If we launch like this, the platform will crash quickly. You MUST upgrade the following services before public launch:

### 1. Vimeo (Video Hosting constraints)
- **The Problem:** Free Vimeo accounts only give you **1GB of storage per year**. Furthermore, you CANNOT hide your videos from the public internet. Free accounts only let you mark videos as "Unlisted", meaning anyone with the link can share it.
- **The Fix:** You need a **Vimeo Pro / Premium / Standard Account**. This massively increases your storage limits and, crucially, lets you lock videos to *Domain-Level Privacy*. This means your premium course videos will strictly only play if they are embedded inside `connecta.sheleadsafrica.org`.

### 2. Supabase / Database Storage
- **The Problem:** Your database (handling users, progress, payments tracking) and buckets (holding course thumbnails and user avatars) are on a free tier. If thousands of students rapidly upload avatars and take quizzes, the database will fill up in a matter of weeks and freeze the application.
- **The Fix:** Upgrade your Supabase project to the **Pro Tier ($25/month)** to ensure you have daily automated backups, 100,000 active monthly users, and 100GB of media storage.

### 3. Email Delivery (SMTP)
- Free tier authentication emails cap at a small amount per hour. You need a dedicated transactional email provider (like Postmark, SendGrid, or Resend) so that thousands of new students receive their "Welcome to Connecta" emails immediately without bouncing.

---

## 📋 Part 3: What Else You Need to Bring (Client Homework)

To successfully remove the final roadblocks and enter full production mode, please prepare the following assets to be plugged into the code:

- [ ] **Paid Vimeo Subscription:** Required immediately for course upload privacy.
- [ ] **Live Paystack API Keys:** We are currently using demo/test mode. Need production keys to process real Naira/USD transactions.
- [ ] **Official Domain Name:** Wait on deploying the production build until you have your domain ready (e.g., `learn.sheleadsafrica.org`).
- [ ] **Supabase Pro Upgrade:** Ensure your developer hands over the master Supabase ownership to SLA so you can attach a business credit card to the project.

**Test the platform thoroughly and provide any UI/UX feedback. The code is structured beautifully for quick iteration!**
