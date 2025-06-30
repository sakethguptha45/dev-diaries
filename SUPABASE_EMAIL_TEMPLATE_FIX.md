# 🔧 SUPABASE EMAIL TEMPLATE FIX

## ❌ CURRENT PROBLEM
Your Supabase email template is sending **magic links** instead of **OTP codes**.

Current template in your screenshot shows:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

## ✅ SOLUTION: Update Email Template

### Step 1: Go to Your Supabase Dashboard
1. Open: https://app.supabase.com/project/bdddsoyknozytcsvtlauth/auth/templates
2. Click on **"Confirm signup"** template (which you have open)

### Step 2: Replace the Template Content

**REPLACE** the current template with this OTP-focused template:

```html
<h2>Verify Your Email Address</h2>
<p>Welcome to Dev Diaries! Please use the verification code below to confirm your email address:</p>

<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
  <h1 style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px; margin: 0;">
    {{ .Token }}
  </h1>
  <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
    This code expires in 5 minutes
  </p>
</div>

<p>If you didn't request this verification, please ignore this email.</p>

<p style="color: #6b7280; font-size: 12px;">
  This is an automated message from Dev Diaries. Please do not reply to this email.
</p>
```

### Step 3: Save the Template
1. Click **"Save"** button
2. The template will be updated immediately

### Step 4: Test the New Template
1. Go back to your app
2. Try registering with a **new email address**
3. You should now receive a **6-digit code** instead of a link

## 🎯 KEY CHANGES MADE

1. **`{{ .ConfirmationURL }}` → `{{ .Token }}`** - This is the critical change
2. **Clear subject**: "Verify Your Email Address"
3. **Prominent code display**: Large, bold, centered 6-digit code
4. **Clear instructions**: Tells user exactly what to do
5. **Expiration notice**: Mentions 5-minute expiry

## 🔍 VERIFICATION

After updating the template, you should receive emails like this:

```
Subject: Verify Your Email Address

Verify Your Email Address
Welcome to Dev Diaries! Please use the verification code below to confirm your email address:

    123456
    This code expires in 5 minutes

If you didn't request this verification, please ignore this email.
```

## 🚨 IMPORTANT NOTES

- **Use a NEW email address** to test (not one you've already tried)
- The change takes effect immediately
- Old pending verifications may still use the old template
- Check spam/junk folders as always

## 🆘 IF STILL NOT WORKING

1. **Double-check the template** - Make sure `{{ .Token }}` is exactly as shown
2. **Try different email provider** - Gmail works best
3. **Wait 5-10 minutes** - Some email providers have delays
4. **Check Supabase logs** - Go to Logs section in your dashboard