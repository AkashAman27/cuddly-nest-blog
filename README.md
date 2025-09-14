# CuddlyNest Blog

A modern, multilingual travel blog built with Next.js 15, Supabase, and TypeScript. Features a complete admin CMS, AI-powered translations, and optimized performance.

## 🚀 Features

- **Modern Tech Stack**: Next.js 15.2.4, TypeScript, Tailwind CSS
- **Database**: Supabase PostgreSQL with RLS policies
- **Admin CMS**: Complete content management system
- **Multilingual**: AI-powered translations (French, Italian, German, Spanish)
- **SEO Optimized**: Meta tags, JSON-LD, sitemaps
- **Image Generation**: AI-powered blog image creation
- **Performance**: Optimized for speed and Core Web Vitals

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AkashAman27/cuddly-nest-blog.git
   cd cuddly-nest-blog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   - Supabase URL and keys
   - Google API key (for image generation)
   - Mistral API key (for translations)

4. **Database Setup**
   - Create a new Supabase project
   - Run the database migrations (SQL scripts in `/supabase/migrations/`)
   - Set up RLS policies

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/             # Admin CMS pages
│   ├── api/               # API routes
│   ├── blog/              # Blog pages and routing
│   └── article/           # Static article template
├── components/            # Reusable React components
│   ├── admin/             # Admin-specific components
│   └── blog-article-template.tsx
├── lib/                   # Utility libraries
│   ├── services/          # API services (translation, image gen)
│   ├── security/          # Authentication & authorization
│   ├── utils/             # Helper functions
│   └── supabase.ts        # Database client
├── supabase/              # Database schema and migrations
└── public/                # Static assets
```

## 🔐 Security Features

- ✅ Environment variables for all API keys
- ✅ RLS policies on database tables
- ✅ Authentication for admin routes
- ✅ Input validation and sanitization
- ✅ No hardcoded secrets

## 🌍 Multilingual Support

The blog supports translations in:
- 🇫🇷 French (fr)
- 🇮🇹 Italian (it) 
- 🇩🇪 German (de)
- 🇪🇸 Spanish (es)

Translations are powered by Mistral AI and stored separately from original content.

## 📊 Admin Features

- **Post Management**: Create, edit, publish posts
- **Translation Management**: AI-powered content translation
- **Image Generation**: AI blog image creation
- **Analytics**: Post views and engagement
- **Category Management**: Organize content by topics

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_API_KEY=your_google_api_key
MISTRAL_API_KEY=your_mistral_api_key
```

## 🗃️ Database Schema

Key tables:
- `cuddly_nest_modern_post` - Blog posts
- `modern_authors` - Author profiles  
- `modern_categories` - Content categories
- `post_translations` - Translated content
- `modern_post_categories` - Post-category relationships

## 🎨 Customization

- **Styling**: Modify Tailwind classes in components
- **Content Types**: Extend database schema as needed
- **Languages**: Add new language codes to translation service
- **APIs**: Integrate additional AI services in `/lib/services/`

## 📈 Performance

- **Image Optimization**: Next.js Image component
- **Database**: Indexed queries and optimized schema
- **Caching**: Static generation where possible
- **Bundle Size**: Tree shaking and code splitting

## 🛡️ Security Considerations

1. Keep environment variables secure
2. Regularly update dependencies
3. Monitor Supabase RLS policies
4. Use HTTPS in production
5. Implement rate limiting for APIs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For questions or issues:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Contact the development team

## 🔗 Links

- **Live Site**: [Your deployed URL]
- **Admin Panel**: [Your site]/admin
- **Supabase**: [Your Supabase dashboard]

---

Built with ❤️ using Next.js, Supabase, and modern web technologies.