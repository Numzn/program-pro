# Church Program Pro - Deployment Guide

## Overview
This guide covers deploying the Church Program Pro application to Vercel with a production database.

## Prerequisites

### Required Accounts
- **GitHub Account** - For code repository
- **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
- **Database Provider** - Choose one of the options below

### Database Options

#### Option 1: Vercel Postgres (Recommended)
- **Free Tier**: 1 database, 1GB storage
- **Setup**: Vercel Dashboard → Storage → Create Database
- **Connection**: Automatic environment variable setup

#### Option 2: Railway (railway.app)
- **Free Tier**: 1GB storage, 1 database
- **Setup**: Connect GitHub, create new project
- **Connection**: Copy connection string

#### Option 3: Supabase (supabase.com)
- **Free Tier**: 500MB storage, 2 databases
- **Setup**: Create new project
- **Connection**: Use connection string from settings

#### Option 4: PlanetScale (planetscale.com)
- **Free Tier**: 1 database, 1GB storage
- **Setup**: Create new database
- **Connection**: Use connection string

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Method A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: church-program-pro
# - Directory: ./
# - Override settings? No
```

#### Method B: GitHub Integration
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import from GitHub
4. Select your repository
5. Configure build settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `client/dist`

### 3. Set Up Database

#### For Vercel Postgres:
1. Go to Vercel Dashboard → Your Project → Storage
2. Create new Postgres database
3. Copy the connection string

#### For External Database:
1. Set up your chosen database provider
2. Create a new database
3. Copy the connection string

### 4. Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```
DATABASE_URL = [your production database URL]
JWT_SECRET = [secure random string for production]
NODE_ENV = production
PORT = 8000
```

### 5. Database Migration

After deployment, you need to run the database schema:

#### Option A: Direct Database Access
1. Connect to your production database
2. Run the SQL from `server/src/database/schema.sql`
3. This creates all required tables

#### Option B: Migration Endpoint (Temporary)
1. Add a temporary migration endpoint to your server
2. Visit `https://your-app.vercel.app/api/migrate`
3. Remove the endpoint after migration

### 6. Test Your Deployment

#### Basic Functionality
- [ ] Visit your Vercel URL
- [ ] Test admin login
- [ ] Create a test program
- [ ] Test bulk import functionality
- [ ] Verify PWA installation

#### Advanced Features
- [ ] Test template save/load
- [ ] Update church settings
- [ ] Test mobile responsiveness
- [ ] Verify HTTPS and SSL

## Post-Deployment Configuration

### 1. Update Church Settings
1. Go to Admin → Settings
2. Update church name and branding
3. Configure theme colors if needed

### 2. Create Initial Content
1. Create your first program
2. Test bulk import with sample data
3. Save useful templates

### 3. Custom Domain (Optional)
1. Go to Vercel Dashboard → Project → Domains
2. Add your custom domain
3. Configure DNS settings

## Troubleshooting

### Common Issues

#### Build Failures
- **Error**: "Module not found"
- **Solution**: Check all imports and dependencies

#### Database Connection Issues
- **Error**: "Connection refused"
- **Solution**: Verify DATABASE_URL format and credentials

#### API 500 Errors
- **Error**: "Internal Server Error"
- **Solution**: Check server logs in Vercel dashboard

#### PWA Not Installing
- **Error**: Install prompt not showing
- **Solution**: Ensure HTTPS and valid manifest

### Debugging Steps

1. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Project → Functions
   - View function logs for errors

2. **Test API Endpoints**:
   - Visit `https://your-app.vercel.app/api/programs`
   - Should return JSON response

3. **Verify Database**:
   - Check if tables were created
   - Test database connection

## Security Considerations

### Production Checklist
- [ ] Change JWT_SECRET to a secure random string
- [ ] Use HTTPS (automatic with Vercel)
- [ ] Set up proper CORS policies
- [ ] Enable rate limiting
- [ ] Regular database backups

### Environment Variables Security
- Never commit `.env` files to Git
- Use Vercel's environment variable system
- Rotate secrets regularly

## Monitoring and Maintenance

### Performance Monitoring
- Use Vercel Analytics
- Monitor database performance
- Check function execution times

### Regular Maintenance
- Update dependencies regularly
- Monitor database storage usage
- Backup important data

## Support

### Getting Help
- Check Vercel documentation
- Review application logs
- Test locally first

### Scaling Considerations
- Monitor database usage
- Consider upgrading database plan
- Optimize queries for performance

## Success Criteria

Your deployment is successful when:
- ✅ Application loads without errors
- ✅ Admin login works
- ✅ Programs can be created and viewed
- ✅ Bulk import functions correctly
- ✅ PWA installs on mobile devices
- ✅ All features work as expected

## Next Steps

After successful deployment:
1. Share the URL with your congregation
2. Train administrators on the system
3. Create your first programs
4. Set up regular backups
5. Monitor usage and performance
