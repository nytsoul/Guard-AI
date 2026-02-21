import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { AttackLogs } from './pages/AttackLogs';
import { PolicyConfig } from './pages/PolicyConfig';
import { RagScanner } from './pages/RagScanner';
import { RedTeam } from './pages/RedTeam';
import { ChatDemo } from './pages/ChatDemo';
import { Analytics } from './pages/Analytics';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'projects',
        element: <Projects />
      },
      {
        path: 'logs',
        element: <AttackLogs />
      },
      {
        path: 'policy',
        element: <PolicyConfig />
      },
      {
        path: 'rag-scanner',
        element: <RagScanner />
      },
      {
        path: 'red-team',
        element: <RedTeam />
      },
      {
        path: 'chat-demo',
        element: <ChatDemo />
      },
      {
        path: 'analytics',
        element: <Analytics />
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);
