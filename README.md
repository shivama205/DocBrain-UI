# DocBrain UI

<p align="center">
  <img src="https://via.placeholder.com/200x200?text=DocBrain" alt="DocBrain Logo" width="200" height="200">
</p>

<p align="center">
  <b>A modern, intuitive UI for interacting with your document knowledge bases</b>
</p>

<p align="center">
  <i>The official frontend for <a href="https://github.com/shivama205/DocBrain">DocBrain</a> - A powerful RAG framework for building AI applications with context-aware responses</i>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-documentation">API Documentation</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a> •
  <a href="#current-version">Current Version</a>
</p>

<p align="center">
  <img src="https://via.placeholder.com/800x400?text=DocBrain+UI+Screenshot" alt="DocBrain UI Screenshot" width="800">
</p>

## ✨ Features

DocBrain UI is a powerful frontend application for managing and interacting with document knowledge bases:

- **🔐 User Authentication**: Secure login and token-based authentication
- **📚 Knowledge Base Management**: Create, view, and manage your knowledge bases
- **📄 Document Management**: Upload, process, and organize documents within knowledge bases
- **👥 Role-Based Access Control**: Manage user permissions with Owner, Admin, and User roles
- **🔄 Knowledge Base Sharing**: Easily share knowledge bases with other users in your organization
- **💬 Conversational Interface**: Chat with your documents using a natural language interface
- **🔍 Source Attribution**: View the exact sources used to generate responses
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A running instance of the [DocBrain API server](https://github.com/shivama205/DocBrain)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/DocBrain-UI.git
   cd DocBrain-UI
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   VITE_API_URL=http://localhost:8000
   ```
   Replace the URL with your DocBrain API server address.

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## 📖 Usage

### Authentication

1. Navigate to the login page
2. Enter your email and password
3. Upon successful authentication, you'll be redirected to the dashboard

### Managing Knowledge Bases

1. Create a new knowledge base by clicking the "New Knowledge Base" button
2. Give your knowledge base a name and description
3. Upload documents to your knowledge base
4. Start chatting with your documents

### Sharing Knowledge Bases

1. Select a knowledge base
2. Click the "Share" button in the knowledge base details page
3. Search for users by name or email
4. Click on a user to grant them access to your knowledge base
5. Manage existing shared users from the same interface

### User Roles and Permissions

DocBrain UI implements a comprehensive role-based access control system:

- **Owner**: Has full access to all knowledge bases and can manage all users
- **Admin**: Has access to all knowledge bases and can manage regular users
- **User**: Has access only to their own knowledge bases and those shared with them

### Chatting with Documents

1. Select a knowledge base
2. Type your question in the chat input
3. View the AI-generated response along with source attributions
4. Continue the conversation with follow-up questions

## 📚 API Documentation

The DocBrain UI interacts with the [DocBrain API](https://github.com/shivama205/DocBrain). For detailed API documentation, see [api.md](api.md).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For more details, see our [Contributing Guide](CONTRIBUTING.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📦 Current Version

**Current Version: v1.2.0**

Latest release includes Knowledge Base Sharing, Role-Based Access Control, and User Management features.

For detailed release notes, see [RELEASE_NOTES.md](RELEASE_NOTES.md).

## 🙏 Acknowledgements

- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at Any Scale
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icons
- [DocBrain](https://github.com/shivama205/DocBrain) - The backend RAG framework 