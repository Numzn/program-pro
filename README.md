# Church Program Pro

A modern, full-stack application for managing church programs, events, and schedules with a beautiful PWA interface.

## Features

- 🎯 **Program Management** - Create, edit, and manage church programs
- 📅 **Schedule Management** - Detailed schedule items with timing and types
- 👥 **Special Guests** - Manage guest speakers and participants
- 📱 **PWA Support** - Installable mobile app experience
- 🎨 **Premium Design** - Modern, responsive UI with custom theming
- 📊 **Bulk Import** - Import programs from JSON templates
- 💾 **Template System** - Save and reuse program templates
- ⚙️ **Admin Dashboard** - Complete administrative interface
- 🔐 **Authentication** - Secure user authentication system
- 🏢 **Multi-Church** - Support for multiple church organizations

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **VitePWA** for PWA functionality

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **SQLite/PostgreSQL** database support
- **JWT** authentication
- **Zod** for validation
- **Helmet** for security

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd church-program-pro
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Deployment

### Vercel Deployment (Recommended)

#### Prerequisites
- GitHub account
- Vercel account
- Database provider (Vercel Postgres, Railway, Supabase, or PlanetScale)

#### Step-by-Step Deployment

1. **Prepare your repository**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   
   **Option A: Vercel CLI**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```
   
   **Option B: GitHub Integration**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Configure build settings:
     - Framework Preset: Other
     - Root Directory: `./`
     - Build Command: `npm run vercel-build`
     - Output Directory: `client/dist`

3. **Set up database**
   
   **Vercel Postgres (Recommended)**
   - Go to Vercel Dashboard → Your Project → Storage
   - Create new Postgres database
   - Copy the connection string
   
   **External Database Options**
   - [Railway](https://railway.app) - Free tier available
   - [Supabase](https://supabase.com) - PostgreSQL with free tier
   - [PlanetScale](https://planetscale.com) - MySQL with free tier

4. **Configure environment variables**
   
   In Vercel Dashboard → Project → Settings → Environment Variables:
   ```
   DATABASE_URL = [your production database URL]
   JWT_SECRET = [secure random string for production]
   NODE_ENV = production
   PORT = 8000
   ```

5. **Run database migration**
   
   **Option A: Direct database access**
   - Connect to your production database
   - Run the SQL from `server/src/database/schema.sql`
   
   **Option B: Migration endpoint (Temporary)**
   - Add a temporary migration endpoint to your server
   - Visit `https://your-app.vercel.app/api/migrate`
   - Remove the endpoint after migration

6. **Test your deployment**
   - Visit your Vercel URL
   - Test admin login
   - Create a test program
   - Test bulk import functionality
   - Verify PWA installation

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
# or for SQLite (development only)
# DATABASE_URL=sqlite:./dev.db

# JWT Secret (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production

# Server Configuration
PORT=8000

# Environment
NODE_ENV=production
```

### Database Setup

The application supports both SQLite (development) and PostgreSQL (production):

- **SQLite**: No additional setup required
- **PostgreSQL**: Requires a PostgreSQL database

### Church Settings

After deployment, configure your church settings:

1. Go to Admin → Settings
2. Update church name and branding
3. Configure theme colors if needed
4. Set up your first programs

## Usage

### Creating Programs

1. **Manual Creation**
   - Go to Admin → Programs → Create New Program
   - Fill in program details
   - Add schedule items and special guests
   - Save the program

2. **Bulk Import**
   - Go to Admin → Programs → Bulk Import
   - Use JSON templates to import programs
   - Save templates for reuse
   - Load existing templates

### Template System

The application includes a powerful template system:

- **Save Templates**: Save program structures for reuse
- **Load Templates**: Load previously saved templates
- **Download Templates**: Download sample templates
- **JSON Format**: Easy to edit and version control

### PWA Features

- **Install on Mobile**: Add to home screen on mobile devices
- **Offline Support**: Basic offline functionality
- **Push Notifications**: (Future feature)
- **App-like Experience**: Full-screen, native feel

## Development

### Project Structure

```
church-program-pro/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── src/
│   │   ├── api/          # API routes
│   │   ├── services/     # Business logic
│   │   ├── middleware/    # Express middleware
│   │   └── database/     # Database configuration
└── docker/               # Docker configuration
```

### Available Scripts

```bash
# Development
npm run dev              # Start both client and server
npm run dev:client       # Start only client
npm run dev:server       # Start only server

# Building
npm run build            # Build both client and server
npm run build:client     # Build only client
npm run build:server     # Build only server

# Database
npm run migrate          # Run database migration
npm run db:seed          # Seed database with sample data

# Docker
npm run docker:dev       # Start with Docker Compose
npm run docker:build     # Build Docker images
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

**Build Failures**
- Check all imports and dependencies
- Ensure TypeScript compilation passes
- Verify environment variables are set

**Database Connection Issues**
- Verify DATABASE_URL format and credentials
- Check database server is running
- Ensure network connectivity

**API 500 Errors**
- Check server logs in Vercel dashboard
- Verify database migration completed
- Check environment variables

**PWA Not Installing**
- Ensure HTTPS is enabled
- Check manifest.json is accessible
- Verify service worker is registered

### Getting Help

- Check the [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions
- Review application logs for error details
- Test locally first before deploying
- Ensure all environment variables are set correctly

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the documentation
- Review the deployment guide
- Test locally first
- Check application logs

## Roadmap

- [ ] Push notifications
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] Advanced theming
- [ ] API documentation
- [ ] Unit tests
- [ ] E2E tests
- [ ] Performance monitoring
