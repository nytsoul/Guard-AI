import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { lazy, Suspense } from 'react';

// Lazy load page components for code-splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })));
const AttackLogs = lazy(() => import('./pages/AttackLogs').then(m => ({ default: m.AttackLogs })));
const PolicyConfig = lazy(() => import('./pages/PolicyConfig').then(m => ({ default: m.PolicyConfig })));
const RagScanner = lazy(() => import('./pages/RagScanner').then(m => ({ default: m.RagScanner })));
const RedTeam = lazy(() => import('./pages/RedTeam').then(m => ({ default: m.RedTeam })));
const ChatDemo = lazy(() => import('./pages/ChatDemo').then(m => ({ default: m.ChatDemo })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Wrapper for lazy components with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(LandingPage)
  },
  {
    path: '/login',
    element: withSuspense(Login)
  },
  {
    path: '/signup',
    element: withSuspense(Signup)
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'dashboard',
        element: withSuspense(Dashboard)
      },
      {
        path: 'projects',
        element: withSuspense(Projects)
      },
      {
        path: 'logs',
        element: withSuspense(AttackLogs)
      },
      {
        path: 'policy',
        element: withSuspense(PolicyConfig)
      },
      {
        path: 'rag-scanner',
        element: withSuspense(RagScanner)
      },
      {
        path: 'red-team',
        element: withSuspense(RedTeam)
      },
      {
        path: 'chat-demo',
        element: withSuspense(ChatDemo)
      },
      {
        path: 'analytics',
        element: withSuspense(Analytics)
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);
