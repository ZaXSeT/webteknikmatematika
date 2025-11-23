# How to Deploy to Vercel

You have two main options to deploy this Next.js application to Vercel.

## Option 1: Deploy via GitHub (Recommended)

This method sets up "Continuous Deployment" - every time you push code to GitHub, Vercel will automatically redeploy your site.

1.  **Create a Repository on GitHub**
    *   Go to [GitHub.com](https://github.com) and create a new repository (e.g., `teknik-matematika`).

2.  **Push Your Code**
    *   Open your terminal in this project folder.
    *   Run the following commands (replace `YOUR_USERNAME` and `YOUR_REPO` with yours):
        ```bash
        git config --global user.email "you@example.com"
        git config --global user.name "Your Name"
        git add .
        git commit -m "Initial commit"
        git branch -M main
        git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
        git push -u origin main
        ```

3.  **Import to Vercel**
    *   Go to [Vercel.com](https://vercel.com) and log in.
    *   Click **"Add New..."** -> **"Project"**.
    *   Select "Continue with GitHub" and choose the repository you just created.
    *   **Important:** In the "Environment Variables" section, add any variables from your `.env` file (e.g., `DATABASE_URL`, `NEXT_PUBLIC_...`).
    *   Click **"Deploy"**.

## Option 2: Deploy via Vercel CLI (Fastest)

This method deploys directly from your command line without needing GitHub.

1.  **Install Vercel CLI**
    ```bash
    npm i -g vercel
    ```

2.  **Login**
    ```bash
    npx vercel login
    ```

3.  **Deploy**
    ```bash
    npx vercel
    ```
    *   Follow the prompts (say `Y` to everything).
    *   It will give you a "Production" URL.

## Environment Variables

Don't forget to add your Environment Variables in the Vercel Dashboard under **Settings > Environment Variables**.
