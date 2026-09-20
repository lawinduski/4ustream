# 4uStream — Mobile Deploy Edition

Static HTML/CSS/JS build. Next.js has been removed from the deploy package.

Deploy directly to Vercel, Cloudflare Pages, GitHub Pages (without the Firebase config API), or another static host.

For Vercel, upload/push this folder as the project root. No build command and no framework preset are required.

Firebase Web configuration is loaded from /api/firebase-config on Vercel using the existing Firebase environment variables.
