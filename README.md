# SAR-RANG — SAR Image Colorization Platform

> A research-focused web platform for SAR image colorization using a custom-trained Pix2Pix Conditional GAN model deployed for inference via Hugging Face.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Model](#model)
- [Project Structure](#project-structure)
- [Pages & Routing](#pages--routing)
- [Backend (Edge Functions)](#backend-edge-functions)
- [Environment Variables & Secrets](#environment-variables--secrets)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

---

## Overview

**SAR-RANG** is a web application that enables users to colorize grayscale SAR satellite images using a deep-learning pipeline. The platform also serves as a knowledge hub with blogs, research articles, FAQs, and information pages for researchers and defense professionals.

---

## Features

| Feature                    | Description                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| **SAR Image Colorization** | Upload a grayscale SAR image and receive a colorized output from our trained Pix2Pix GAN model |
| **Example Gallery**        | Side-by-side before/after examples across land-cover classes                                   |
| **Blogs & Articles**       | Educational content on SAR, deep learning, and radar colorization                              |
| **Contact Form**           | Sends messages via Web3Forms                                                                   |
| **Cinematic Loader**       | First-visit animated orbital loader (GSAP + Three.js)                                          |
| **Smooth Scrolling**       | Lenis-powered smooth scroll with GSAP ScrollTrigger animations                                 |
| **Solar System Hero**      | Interactive Three.js hero background with mouse parallax                                       |
| **Responsive**             | Fully responsive with mobile-simplified 3D mode                                                |

---

## Tech Stack

| Layer             | Technology                           |
| ----------------- | ------------------------------------ |
| Framework         | React 18 + TypeScript                |
| Build Tool        | Vite                                 |
| Styling           | Tailwind CSS + shadcn/ui             |
| Animations        | GSAP (ScrollTrigger) + Lenis         |
| 3D Graphics       | Three.js (@react-three/fiber + drei) |
| Backend           | Supabase Edge Functions (Deno)       |
| Forms             | Web3Forms API                        |
| Model Training    | PyTorch (Pix2Pix Conditional GAN)    |
| Inference Hosting | Hugging Face Gradio Space (public)   |

---

## Model

The colorization model is a custom-trained **Pix2Pix Conditional GAN** implemented in PyTorch.

### Architecture

| Component       | Details                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| **Generator**   | U-Net with skip connections for preserving spatial detail               |
| **Discriminator** | PatchGAN — classifies overlapping image patches as real or fake       |
| **Input**       | Single-channel grayscale SAR backscatter image                          |
| **Output**      | 3-channel colorized image with scientifically meaningful color mapping  |

### Training Pipeline

1. **Ground Truth Generation:** IHS (Intensity-Hue-Saturation) fusion is used — the SAR intensity channel replaces the I-channel of co-registered optical imagery to create paired training data.
2. **Loss Function:** Combined adversarial loss + L1 pixel-wise reconstruction loss, ensuring both realistic texture and pixel-level accuracy.
3. **Goal:** The model learns a radar-backscatter-to-color mapping that preserves SAR characteristics — it does **not** synthesize optical imagery.

### Inference

- Inference is served via a **public Hugging Face Gradio Space**.
- The frontend calls the Gradio endpoint directly — **no backend proxy or API key is required**.
- Processing is lightweight and runs on the Hugging Face-hosted GPU.

---

## Project Structure

```
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── animations/
│   │   ├── about/
│   │   ├── home/
│   │   ├── layout/
│   │   ├── three/
│   │   └── ui/
│   ├── data/
│   ├── hooks/
│   ├── integrations/supabase/
│   ├── pages/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── supabase/
│   ├── config.toml
│   └── functions/
│       └── send-contact/
└── .env.example
```

---

## Pages & Routing

| Route             | Page           | Description                                                       |
| ----------------- | -------------- | ----------------------------------------------------------------- |
| `/`               | Home           | Hero with solar-system animation, audience cards, specializations |
| `/about`          | About          | Model architecture, evaluation metrics                            |
| `/blogs`          | Blogs          | Blog listing                                                      |
| `/blogs/:slug`    | Blog Detail    | Individual blog post                                              |
| `/articles`       | Articles       | Research article listing                                          |
| `/articles/:slug` | Article Detail | Individual article                                                |
| `/faqs`           | FAQs           | Frequently asked questions                                        |
| `/contact`        | Contact        | Contact form (powered by Web3Forms)                               |
| `/researchers`    | Researchers    | Information for researchers                                       |
| `/defense`        | Defense        | Defense & military applications                                   |
| `/sar-rang/demo`  | Colorize       | Upload & colorize SAR images                                      |

---

## Backend (Edge Functions)

### `send-contact`

- **Purpose:** Receives contact form submissions and forwards them to Web3Forms.
- **Auth:** Public (no JWT required).
- **Required Secret:** `WEB3FORMS_ACCESS_KEY`

---

## Environment Variables & Secrets

### Frontend (`.env`)

These are automatically configured when using Lovable Cloud. For self-hosting, copy `.env.example` and fill in:

| Variable                        | Description                                               |
| ------------------------------- | --------------------------------------------------------- |
| `VITE_SUPABASE_PROJECT_ID`      | Your Supabase project ID                                  |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key                                  |
| `VITE_SUPABASE_URL`             | Supabase project URL (`https://<project-id>.supabase.co`) |

### Backend Secrets (Supabase Vault)

These must be set as Supabase secrets (via CLI or dashboard) for edge functions to work:

| Secret                      | Required By    | How to Obtain                             |
| --------------------------- | -------------- | ----------------------------------------- |
| `WEB3FORMS_ACCESS_KEY`      | `send-contact` | Sign up at web3forms.com → Get access key |
| `SUPABASE_URL`              | Auto-provided  | Automatically set by Supabase             |
| `SUPABASE_ANON_KEY`         | Auto-provided  | Automatically set by Supabase             |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided  | Automatically set by Supabase             |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- A Supabase project

### Installation

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Set Supabase secrets (for edge functions)
npx supabase secrets set WEB3FORMS_ACCESS_KEY=your_key_here

# 5. Start the dev server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Running Edge Functions Locally

```bash
# Start Supabase locally
npx supabase start

# Serve edge functions
npx supabase functions serve
```

---

## Deployment

### Self-Hosted

1. Build the frontend: `npm run build`
2. Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, Lovable, etc.)
3. Deploy edge functions to your Supabase project: `npx supabase functions deploy`
4. Ensure all secrets are configured in your Supabase project.

---
