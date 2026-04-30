# Twilio SMS/WhatsApp UI Guide

## Visual Walkthrough of the New Feature

### 1. Participants Page - Dropdown Menu

**Location:** ParticipantsPage.tsx → Participant Row → Actions Menu (⋮)

**New Menu Item Added:**
```
┌─────────────────────────────┐
│ Copy email                  │
│ Email participant           │
│ 💬 Send SMS / WhatsApp      │  ← NEW
│ Delete participant          │
└─────────────────────────────┘
```

**Icon:** MessageSquare (speech bubble icon)

---

### 2. SMS/WhatsApp Modal Dialog

**Triggered by:** Clicking "Send SMS / WhatsApp" in dropdown

**Modal Layout:**

```
┌────────────────────────────────────────────────┐
│  Send SMS Message                              │
│  Send a message to [Participant Name] via SMS  │
├────────────────────────────────────────────────┤
│                                                │
│  Channel                                       │
│  ┌──────────────────────────────────────────┐ │
│  │ SMS                              ▼       │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Phone Number                                  │
│  ┌──────────────────────────────────────────┐ │
│  │ +1234567890                              │ │
│  └──────────────────────────────────────────┘ │
│  Include country code (e.g., +1 for US)       │
│                                                │
│  Message                                       │
│  ┌──────────────────────────────────────────┐ │
│  │ Type your message here...                │ │
│  │                                          │ │
│  │                                          │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│  0 characters                                  │
│                                                │
│                    [ Cancel ]  [ Send SMS ]    │
└────────────────────────────────────────────────┘
```

---

### 3. Channel Selector Options

**Dropdown Values:**
- SMS (default)
- WhatsApp

**Dynamic Behavior:**
- Modal title changes: "Send SMS Message" → "Send WhatsApp Message"
- Button text changes: "Send SMS" → "Send WhatsApp"
- Description updates to reflect selected channel

---

### 4. Form Fields

#### Channel Selector
- **Type:** Dropdown (Select component)
- **Options:** SMS, WhatsApp
- **Default:** SMS

#### Phone Number Input
- **Type:** Text input (tel)
- **Placeholder:** "+1234567890"
- **Validation:** Required
- **Helper Text:** "Include country code (e.g., +1 for US, +234 for Nigeria)"

#### Message Textarea
- **Type:** Textarea
- **Rows:** 4
- **Placeholder:** "Type your message here..."
- **Validation:** Required
- **Character Counter:** Shows live count below textarea

---

### 5. Button States

#### Send Button
**States:**
1. **Disabled (gray):** When phone or message is empty
2. **Enabled (blue):** When both fields are filled
3. **Loading (blue):** Shows "Sending..." during API call
4. **Success:** Modal closes, toast appears

**Styling:**
- Background: `#0056D2` (She Leads Africa blue)
- Hover: `#00419e` (darker blue)

#### Cancel Button
**States:**
1. **Enabled:** Always clickable
2. **Disabled:** During sending operation

**Styling:**
- Variant: Outline
- Closes modal without action

---

### 6. Toast Notifications

#### Success Toast
```
✓ SMS sent successfully!
```
or
```
✓ WhatsApp sent successfully!
```

**Duration:** 3 seconds
**Position:** Bottom-right
**Color:** Green

#### Error Toast
```
✗ Failed to send SMS message.
```
or
```
✗ Please provide both phone number and message.
```

**Duration:** 5 seconds
**Position:** Bottom-right
**Color:** Red

---

### 7. User Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  1. Admin views Participants table                     │
│     ↓                                                   │
│  2. Hovers over participant row                        │
│     ↓                                                   │
│  3. Clicks "⋮" (More actions)                          │
│     ↓                                                   │
│  4. Dropdown menu appears                              │
│     ↓                                                   │
│  5. Clicks "💬 Send SMS / WhatsApp"                    │
│     ↓                                                   │
│  6. Modal opens with participant name                  │
│     ↓                                                   │
│  7. Selects channel (SMS or WhatsApp)                  │
│     ↓                                                   │
│  8. Enters phone number with country code              │
│     ↓                                                   │
│  9. Types message                                      │
│     ↓                                                   │
│  10. Clicks "Send SMS" or "Send WhatsApp"              │
│     ↓                                                   │
│  11. Button shows "Sending..."                         │
│     ↓                                                   │
│  12. API call to Supabase Edge Function                │
│     ↓                                                   │
│  13. Edge Function calls Twilio API                    │
│     ↓                                                   │
│  14. Success/Error response                            │
│     ↓                                                   │
│  15. Modal closes (on success)                         │
│     ↓                                                   │
│  16. Toast notification appears                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 8. Responsive Design

**Desktop (>768px):**
- Modal width: 500px
- Full form layout
- Side-by-side buttons

**Mobile (<768px):**
- Modal width: 90vw
- Stacked form layout
- Full-width buttons

---

### 9. Accessibility Features

✅ **Keyboard Navigation:**
- Tab through form fields
- Enter to submit
- Escape to close modal

✅ **Screen Reader Support:**
- Proper ARIA labels
- Form field labels
- Button descriptions

✅ **Focus Management:**
- Auto-focus on phone number field when modal opens
- Focus trap within modal
- Return focus to trigger button on close

---

### 10. Example Messages

**SMS Examples:**
```
Hi [Name], this is a reminder about your upcoming session tomorrow at 2 PM. See you there!
```

```
Congratulations on completing Module 3! Your next assignment is due Friday.
```

**WhatsApp Examples:**
```
Hello! We noticed you haven't logged in recently. Need any help with the course?
```

```
Great progress this week! Keep up the excellent work 🎉
```

---

### 11. Phone Number Format Examples

**Valid Formats:**
- `+1234567890` (US)
- `+442071234567` (UK)
- `+234803456789` (Nigeria)
- `+254712345678` (Kenya)
- `+27821234567` (South Africa)

**Invalid Formats:**
- `1234567890` (missing +)
- `001234567890` (wrong prefix)
- `(123) 456-7890` (formatting characters)

---

### 12. Integration Points

**Data Flow:**

```
ParticipantsPage.tsx
    ↓ (user action)
openSmsModal(participant)
    ↓ (sets state)
Modal renders with participant.name
    ↓ (user fills form)
handleSendSms()
    ↓ (validates input)
api.sendTwilioMessage({ to, message, channel })
    ↓ (API call)
supabase.functions.invoke("twilio-notify")
    ↓ (Edge Function)
Twilio API call
    ↓ (response)
Toast notification
```

---

### 13. Styling Details

**Modal:**
- Border radius: 12px
- Shadow: Large elevation
- Background: Card background (theme-aware)
- Padding: 24px

**Form Fields:**
- Border radius: 8px
- Border: 1px solid border color
- Focus ring: 2px primary color at 40% opacity
- Spacing: 16px between fields

**Buttons:**
- Border radius: 6px
- Height: 40px
- Padding: 12px 24px
- Font weight: 600

---

### 14. Error Handling UI

**Validation Errors:**
- Empty phone: "Please provide both phone number and message."
- Empty message: "Please provide both phone number and message."
- Invalid format: Handled by Twilio API (shows in error toast)

**API Errors:**
- Network error: "Failed to send SMS message."
- Twilio error: Shows Twilio error message in toast
- Credentials missing: "Twilio credentials not configured."

---

### 15. Loading States

**During Send:**
1. Send button disabled
2. Cancel button disabled
3. Button text: "Sending..."
4. Cursor: wait/progress
5. Form fields: Read-only

**After Send:**
1. Modal closes (success)
2. Form resets
3. Toast appears
4. Buttons re-enabled

---

## Testing the UI

### Manual Test Cases

1. **Open Modal:**
   - ✓ Click dropdown → "Send SMS / WhatsApp"
   - ✓ Modal opens with participant name
   - ✓ Phone field is focused

2. **Channel Selection:**
   - ✓ Default is SMS
   - ✓ Can switch to WhatsApp
   - ✓ Title updates dynamically

3. **Form Validation:**
   - ✓ Send button disabled when empty
   - ✓ Send button enabled when filled
   - ✓ Character counter updates

4. **Send Message:**
   - ✓ Button shows "Sending..."
   - ✓ Success toast appears
   - ✓ Modal closes

5. **Error Handling:**
   - ✓ Error toast shows on failure
   - ✓ Modal stays open on error
   - ✓ Can retry after error

6. **Cancel:**
   - ✓ Modal closes
   - ✓ No API call made
   - ✓ Form resets

---

**UI Status:** ✅ Complete and Production-Ready
