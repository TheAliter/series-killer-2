# Series Killer 📚

A modern Vue 3 application for tracking your book series and reading progress. Built with Vue 3, TypeScript, Tailwind CSS, and Supabase.

![Series Killer](https://img.shields.io/badge/Vue-3.5.13-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.39.0-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## ✨ Features

- **📚 Series Management**: Create and manage book series with ease
- **📖 Book Tracking**: Add books to series with detailed information
- **📊 Reading Progress**: Track your reading status (Want to Read, Currently Reading, Completed, Dropped)
- **📅 Release Date Tracking**: Set future release dates for upcoming books
  - Books with future release dates show a lock overlay
  - Release date information is displayed on the lock overlay
  - Dropdown menu remains accessible for editing/deleting locked books
- **⭐ Rating System**: Rate books from 1-5 stars
- **📝 Notes**: Add personal notes to books
- **📈 Progress Visualization**: See your progress through series with visual progress bars
- **🔍 Book Search**: Search for books using Open Library API
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Vue 3 with Composition API
- **TypeScript**: For type safety and better development experience
- **Styling**: Tailwind CSS for modern, responsive design
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide Vue Next
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **State Management**: Pinia

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/series-killer.git
   cd series-killer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🗄️ Database Schema

The app uses the following main tables:
- `books`: Book information including title, status, rating, notes, and release dates
- `series`: Series information including name, description, and total books
- `authors`: Author information

## 📅 Release Date Feature

When adding a book to a series, you can optionally set a release date. If the release date is in the future:
- The book card displays a lock overlay with a lock icon
- The release date is shown below the lock icon
- The dropdown menu remains accessible for editing or deleting the book
- The "Mark as completed" checkbox is hidden for future releases

## 🌐 Deployment

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   npm run deploy
   ```

3. **Follow the prompts** to connect your GitHub repository

### Option 2: Deploy to Netlify

1. **Push your code to GitHub**

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

3. **Add environment variables** in Netlify dashboard

### Option 3: Deploy to GitHub Pages

1. **Add GitHub Pages configuration**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to package.json**
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run deploy` - Deploy to Vercel (if configured)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## GitHub and Vercel (automatic deploys on push)

The repo is initialized on branch `main`. GitHub CLI (`gh`) was not available in this environment, so finish the remote and Vercel import locally:

### 1. Create the GitHub repository

- On [github.com/new](https://github.com/new), create a repository (e.g. `series-killer`), **without** adding a README (this repo already has one).

### 2. Push `main`

```bash
cd series-killer
git remote add origin https://github.com/YOUR_USERNAME/series-killer.git
git push -u origin main
```

Or, with [GitHub CLI](https://cli.github.com/) installed and logged in (`gh auth login`):

```bash
gh repo create series-killer --public --source=. --remote=origin --push
```

### 3. Connect Vercel to GitHub

1. Sign in at [vercel.com](https://vercel.com) and click **Add New… → Project**.
2. **Import** your GitHub repository (install the Vercel GitHub app if prompted).
3. Vercel should auto-detect the framework; confirm **Build Command** `npm run build` and complete the project import settings.
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`  
   (same values as in `.env.local`.)
5. Click **Deploy**. After this, every push to the connected branch (usually `main`) triggers a new deployment.

6. In **Supabase** → Authentication → URL configuration, set **Site URL** (and redirect URLs if needed) to your Vercel production URL.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/) for the amazing framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for the styling
- [Open Library](https://openlibrary.org/) for book data API

---

Made with ❤️ by [Your Name]

# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
