# The Hair Gallery | Hair Salon Reservation & Customer Management

A modern, high-fashion hair salon reservation system and management console built using Next.js 14 (App Router), styled with Tailwind CSS, and powered by Supabase PostgreSQL database tables and Authentication.

Ready to zip, upload to GitHub, and deploy directly onto Cloudflare Pages!

---

## 🚀 Key Architectural Features
1. **Bespoke Landing Page & Service Menu**: Elegant editorial layouts presenting menu categorizations, direct pricing, opening hours, interactive maps, and guest reviews.
2. **Double-Booking Validator**: Client-side reservation calendar connected directly to Next.js API Routes (`/api/reservations`), checking and blocking booked time slots for picked dates.
3. **Admin Cockpit**: Secure administrative panels displaying today's styling grid sorted by time, upcoming calendars, quick action status modifiers (Pending, Confirmed, Completed, Cancelled), and searchable guest histories.
4. **Relational PostgreSQL Schema**: Consistent table structures for Users, ServiceMenus, and Reservations with Row Level Security (RLS) policies configured.

---

## 📁 Project Folder Structure
```text
the-hair-gallery-nextjs/
├── app/
│   ├── admin/
│   │   └── dashboard/
│   │       └── page.tsx      # Admin Protected Dashboard View
│   ├── api/
│   │   └── reservations/
│   │       └── route.ts      # Slot validation & Booking APIs
│   ├── globals.css           # Global Tailwind directives
│   ├── layout.tsx            # Metadata & Page structure
│   └── page.tsx              # Main Salon landing & reservation Form
├── lib/
│   └── supabase.ts           # Safe initialization of Supabase client
├── supabase/
│   └── schema.sql            # Table structures, seeds, and RLS policies
├── package.json              # Next.js & Supabase dependencies
└── README.md                 # Project Setup & Deployment Manual
```

---

## 🛠️ Step-by-Step Local Setup

### 1. Database Setup (Supabase)
1. Head over to [Supabase](https://supabase.com) and spin up a new free PostgreSQL Database.
2. In your Supabase Dashboard, navigate to the **SQL Editor**.
3. Create a new query, paste the full SQL code from `/supabase/schema.sql`, and run it. This will create your `users`, `service_menus`, and `reservations` tables with default service data and Row Level Security (RLS).

### 2. Environment Variables
Create a `.env.local` file in your root folder and supply your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anonymous-public-key
```

### 3. Installation & Run
Run these standard commands in your local terminal:
```bash
# Install NPM dependencies
npm install

# Run the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see your local application.

---

## ⚡ Deploying on Cloudflare Pages
Deploying Next.js applications on Cloudflare Pages is fully supported via the `@cloudflare/next-on-pages` adapter.

1. **Push to GitHub**: Initialize a Git repository, commit all files inside `the-hair-gallery-nextjs/`, and push it to a new private or public GitHub repository.
2. **Connect to Cloudflare**:
   - Log into your [Cloudflare Dashboard](https://dash.cloudflare.com).
   - Go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
   - Select your newly pushed repository.
3. **Build Settings**:
   - Framework preset: **Next.js**.
   - Build command: `npm run build` or `npx @cloudflare/next-on-pages`.
   - Output directory: `.next`.
4. **Environment Variables**:
   - Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` variables to the build settings.
5. Click **Save and Deploy**. Your premium salon dashboard will be live in less than 2 minutes!
