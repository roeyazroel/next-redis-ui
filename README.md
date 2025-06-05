# NextRedisUI

A modern, feature-rich Redis management interface built with Next.js. NextRedisUI provides an intuitive web-based GUI for managing Redis databases with real-time monitoring, data browsing, and terminal access.

## 🔗 Links

- **Live Demo**: [https://v0-modern-redis-ui.vercel.app/](https://v0-modern-redis-ui.vercel.app/)

## 🚀 Features

### 📊 Data Browser

- **Tree View**: Hierarchical key organization with customizable delimiters
- **Multiple View Modes**: Table, JSON, and text views for data visualization
- **Advanced Search**: Pattern matching with filters by type, TTL, and more
- **Key Management**: Create, edit, delete, and copy Redis keys
- **Type Support**: Full support for all Redis data types (string, hash, list, set, zset, JSON)

### 💻 Redis Terminal

- **Interactive CLI**: Execute Redis commands directly in the browser
- **Command History**: Navigate through previous commands with arrow keys
- **Real-time Results**: Instant command execution with formatted output
- **Error Handling**: Clear error messages and debugging information

### 📈 Real-time Monitoring

- **Server Metrics**: Memory usage, client connections, and performance stats
- **Auto-refresh**: Configurable real-time data updates
- **Detailed Analytics**: Hit rates, operations per second, and keyspace statistics
- **System Information**: Server version, uptime, and configuration details

### 🔗 Connection Management

- **Multiple Connections**: Manage and switch between multiple Redis instances
- **Secure Connections**: Support for TLS/SSL and authentication
- **Connection Persistence**: Saved connections in browser local storage
- **Quick Connect**: One-click connection switching

### 🎨 Modern UI/UX

- **Dark/Light Themes**: Seamless theme switching
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Command Palette**: Quick navigation with keyboard shortcuts (⌘K)
- **Resizable Panels**: Customizable workspace layout

## 🛠️ Tech Stack

### Frontend

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn UI](https://ui.shadcn.com/)** - Accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager

## 🏃‍♂️ Getting Started

### Prerequisites

- **Node.js** 22.0 or later
- **pnpm** (recommended) or npm/yarn
- **Redis Server** (local or remote)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/roeyazroel/next-redis-ui.git
   cd next-redis-ui
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the development server**

   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

### Docker Deployment

```bash
# Build the Docker image
docker build -t next-redis-ui .

# Run the container
docker run -p 3000:3000 next-redis-ui
```

## 🔧 Configuration

### Redis Connection

NextRedisUI supports various Redis configurations:

- **Standard Redis**: localhost:6379
- **Redis with Authentication**: username/password
- **Redis with TLS**: SSL/TLS encrypted connections
- **Redis Cloud**: Compatible with Redis Cloud, AWS ElastiCache, etc.

### Environment Variables for Auto-Connection

NextRedisUI supports automatic connection to predefined Redis instances using environment variables. This is especially useful for containerized deployments or when you want to pre-configure connections.

#### Configuration Format

Use indexed environment variables to define multiple Redis connections:

```bash
# Redis Connection 1
REDIS_HOST_1=localhost
REDIS_PORT_1=6379
REDIS_NAME_1=Local Redis
REDIS_USERNAME_1=
REDIS_PASSWORD_1=
REDIS_TLS_1=false

# Redis Connection 2
REDIS_HOST_2=redis.example.com
REDIS_PORT_2=6379
REDIS_NAME_2=Production Redis
REDIS_USERNAME_2=redis_user
REDIS_PASSWORD_2=your_password_here
REDIS_TLS_2=true
```

#### Environment Variable Reference

| Variable           | Required | Description                                       |
| ------------------ | -------- | ------------------------------------------------- |
| `REDIS_HOST_X`     | ✅       | Redis server hostname or IP address               |
| `REDIS_PORT_X`     | ✅       | Redis server port number                          |
| `REDIS_NAME_X`     | ❌       | Display name (defaults to "Redis X")              |
| `REDIS_USERNAME_X` | ❌       | Redis username for authentication                 |
| `REDIS_PASSWORD_X` | ❌       | Redis password for authentication                 |
| `REDIS_TLS_X`      | ❌       | Enable TLS/SSL (set to "true", defaults to false) |

#### Features

- **Auto-Connection**: Environment connections automatically connect on application startup
- **UI Protection**: Environment connections cannot be edited or deleted through the UI
- **Conflict Resolution**: Environment connections take precedence over user connections with the same host:port
- **Sequential Numbering**: Use sequential numbers starting from 1 (e.g., `REDIS_HOST_1`, `REDIS_HOST_2`, etc.)

#### Docker Example

```dockerfile
# Dockerfile or docker-compose.yml
ENV REDIS_HOST_1=redis-server
ENV REDIS_PORT_1=6379
ENV REDIS_NAME_1=Docker Redis
ENV REDIS_PASSWORD_1=your_secure_password
```

## 📱 Usage

1. **Add Connection**: Click "Add Connection" to configure your Redis server
2. **Connect**: Use the power button to establish connection
3. **Browse Data**: Navigate keys in the tree view or use advanced search
4. **Execute Commands**: Use the terminal for direct Redis command execution
5. **Monitor Performance**: View real-time metrics in the monitoring tab

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [v0.dev](https://v0.dev) and Cursor using vibe coding only
- Inspired by Redis Desktop Manager, Redis Commander and other Redis GUI tools
- Thanks to the open-source community for the amazing tools and libraries

---

**NextRedisUI** - Making Redis management simple and beautiful ✨
