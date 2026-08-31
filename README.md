# ZAVITA Studio

Build the initial version of a premium mobile-first AI content creation application called ZAVITA.

IMPORTANT:
This is a product prototype, but it must look and behave like a polished production application. Do not create a generic dashboard. The visual identity, spacing, typography, cards, navigation, buttons, icons, dark theme, gradients, and mobile composition must feel like a real premium AI creator application.

PRODUCT IDENTITY

App name: ZAVITA

Main slogans:

"ZAVITA - Everything is Done"

"Create once. Let AI do the rest."

Brand concept:
ZAVITA is an AI-powered mobile content creation studio that lets creators record, enhance, edit, generate visuals, create AI avatars, and publish content everywhere.

DESIGN SYSTEM

Create a consistent design system and reuse it across every future screen.

Theme:

Mobile-first

Dark mode only

Very dark navy / almost black background

Premium futuristic technology aesthetic

Cyan-blue-to-violet/indigo gradients

Bright violet/blue primary actions

White primary text

Soft gray secondary text

Thin modern minimalist icons

Rounded cards

Subtle borders

Subtle glow effects

High-end AI/SaaS visual language

Avoid excessive glassmorphism

Avoid childish or cartoon-like UI

Brand logo:
Create a stylized Z ribbon logo using a cyan/blue → violet/indigo gradient.
Use the same logo consistently throughout the application.

Typography:

Modern geometric sans-serif

Strong hierarchy

Large section headings

Compact labels

High readability on mobile

Create reusable design tokens for:

background colors

surface colors

border colors

primary gradient

text colors

muted text

corner radius

spacing

shadows/glows

typography sizes

APPLICATION STRUCTURE

Build the application as a mobile-first SPA with multiple internal screens/views.

The application must have a persistent bottom navigation bar with exactly 5 destinations:

Home

Projects

Create — central "+" button, visually emphasized

Avatar

Profile

The central Create button must be larger and visually dominant compared with the other navigation items.

For now, create the navigation architecture and placeholder screens for Projects, Avatar, and Profile, but fully implement Home.

Navigation must work without page reloads.

SPLASH SCREEN

Create an initial splash screen shown when the application starts.

Center:

ZAVITA ribbon logo

"ZAVITA"

"Everything is Done"

At the lower portion:

animated violet circular loading indicator

After a short simulated loading state, transition automatically to Home.

HOME SCREEN

Create a polished mobile dashboard.

Header

Top header contains:

ZAVITA logo

small brand name

slogan / brand subtitle

notification bell icon

PRO badge

The PRO badge should look premium, using a gold/violet accent.

Main CTA

Display:

"What do you want to create?"

Immediately below it, create a large horizontal premium CTA card:

AI CAMERA
"Record a video"

Include:

camera icon

violet/blue gradient

subtle glow

strong visual hierarchy

Clicking this CTA should navigate to the AI Camera screen placeholder for now.

AI FEATURE GRID

Create a 2-column responsive mobile grid.

Cards:

AI VIDEO
"Enhance & edit"

AI PHOTO
"Enhance photos"

AI VOICE
"Enhance voice"

AI BACKGROUND
"Change or blur background"

AI MONTAGE
"Professional editing"

AI CAPTIONS
"Automatic subtitles"

AI AVATAR
"Create a talking avatar"

Each card must have:

minimalist icon

feature title

short description

subtle gradient/glow

press/tap interaction

consistent card dimensions

The AI AVATAR card should navigate to the Avatar screen.

MY PROJECTS

Create a section:

MY PROJECTS

At the right:
See all >

Below:
horizontal scrolling project cards.

Use realistic mock data:

Business Tips — 02:15 — Today

Travel Vlog — 01:28 — Yesterday

Product Review — 00:58 — 2 days ago

Each project card contains:

video thumbnail

duration badge

project title

relative date

subtle dark overlay

PUBLISH EVERYWHERE

Create a section:

PUBLISH EVERYWHERE

Show four platform shortcuts:

YouTube

Facebook

Instagram

TikTok

Use clean recognizable platform icons, but keep the overall UI consistent with the ZAVITA design.

INTERACTION REQUIREMENTS

The prototype must already feel interactive.

Implement:

working bottom navigation

working Home navigation

working AI Camera navigation from the main CTA

working Avatar navigation

horizontal project scrolling

feature card tap states

button hover/press states where applicable

smooth transitions

subtle entrance animations

no dead-looking controls

RESPONSIVE REQUIREMENTS

Primary target:
mobile phone portrait.

Also make it gracefully responsive on:

tablet

desktop browser

On desktop, preserve the feeling of a mobile creator application rather than turning it into a conventional enterprise dashboard.

CODE QUALITY

Use reusable React components.
Avoid duplicating styles.
Create reusable components for:

Header

FeatureCard

ProjectCard

PlatformButton

BottomNavigation

PrimaryButton

SectionHeader

Logo

Keep the architecture clean because additional screens will be added in later development steps.

Do NOT implement the full editor, timeline, AI Enhance, AI Background, AI Voice, AI Avatar Studio, Export, or Publish Everywhere workflows yet.

The priority of this step is:

ZAVITA visual identity

design system

application shell

navigation

splash screen

fully polished Home screen

Make the result feel like a premium AI video/content creation application, not a wireframe.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://zavita-ai-creator.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/feb02c5c-328a-4cb3-b7c7-2099265bcf9a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
