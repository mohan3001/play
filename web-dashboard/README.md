# Playwright AI Web Dashboard

An enterprise-level web dashboard for AI-powered Playwright test automation, providing real-time monitoring, intelligent test management, and seamless integration with your linked Playwright repository (local or remote).

## 🚀 Features

### Phase 1 - Core Dashboard (Current)
- **📊 Real-time Statistics** - Test execution metrics, success rates, and performance indicators
- **🎯 Test Execution Monitoring** - Live test status, progress tracking, and execution history
- **🤖 AI Assistant Status** - Ollama connection monitoring and interaction tracking
- **🏥 System Health** - Framework status, Git integration, and component availability
- **⚡ Quick Actions** - One-click test execution, AI workflows, and Git operations
- **📱 Responsive Design** - Professional UI that works on all devices

### Upcoming Features
- **AI Chat Interface** - Natural language test generation and assistance
- **Test Management** - Feature file browser and test organization
- **Analytics & Reporting** - Advanced metrics and trend analysis
- **Git Integration** - Branch management and workflow automation
- **Team Collaboration** - Multi-user support and sharing features

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Charts**: Recharts for data visualization
- **State Management**: React Query for server state
- **Real-time**: Socket.io for live updates
- **Forms**: React Hook Form with Zod validation

## 📦 Installation

1. **Navigate to the dashboard directory:**
   ```bash
   cd web-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 🏗️ Project Structure

```
web-dashboard/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── layout.tsx         # Root layout with sidebar/header
│   │   ├── page.tsx           # Dashboard home page
│   │   └── globals.css        # Global styles and design tokens
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── button.tsx     # Button component with variants
│   │   │   ├── card.tsx       # Card layout components
│   │   │   └── badge.tsx      # Status and tag badges
│   │   ├── layout/            # Layout components
│   │   │   ├── sidebar.tsx    # Navigation sidebar
│   │   │   └── header.tsx     # Top header with search/actions
│   │   └── dashboard/         # Dashboard-specific components
│   │       ├── stats-cards.tsx    # Statistics overview cards
│   │       └── recent-tests.tsx   # Recent test executions
│   └── lib/
│       └── utils.ts           # Utility functions and helpers
├── tailwind.config.ts         # Tailwind CSS configuration
└── package.json               # Dependencies and scripts
```

## 🎨 Design System

The dashboard uses a comprehensive design system with:

- **Color Palette**: Professional blue theme with semantic colors
- **Typography**: Inter font family for optimal readability
- **Components**: Consistent button, card, and badge variants
- **Spacing**: 8px grid system for consistent layouts
- **Animations**: Subtle transitions and loading states

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the web-dashboard directory:

```env
# AI Layer Integration
NEXT_PUBLIC_AI_API_URL=http://localhost:3001
NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434

# Authentication (future)
NEXT_PUBLIC_AUTH_ENABLED=false

# Analytics (future)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### Customization
- **Colors**: Modify CSS variables in `globals.css`
- **Layout**: Adjust sidebar width and header height in layout components
- **Components**: Extend UI components in `src/components/ui/`

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Recommended for Enterprise)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔗 Integration

The dashboard is designed to integrate seamlessly with:

- **AI Layer**: Direct communication with your existing AI services
- **Playwright Framework**: Real-time test execution monitoring
- **Git Repository**: Branch management and workflow automation
- **CI/CD Pipelines**: Test result integration and reporting

## 📊 Dashboard Sections

### 1. Statistics Overview
- Total tests count and trends
- Pass/fail ratios with visual indicators
- AI interaction metrics
- Git branch status

### 2. Recent Test Executions
- Live test status with real-time updates
- Execution time and browser information
- Error details and debugging links
- Quick action buttons (stop, retry, view logs)

### 3. Quick Actions
- One-click test execution
- AI workflow initiation
- Git operations
- Report generation

### 4. System Health
- Framework component status
- AI assistant connectivity
- Repository integration
- Performance metrics

## 🎯 Enterprise Features

- **Multi-tenancy**: Isolated workspaces for different teams
- **Role-based Access**: Granular permissions and security
- **Audit Logging**: Complete activity tracking
- **Compliance**: GDPR and security compliance features
- **Scalability**: Designed for high-traffic enterprise environments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

**Built with ❤️ for enterprise test automation teams**
