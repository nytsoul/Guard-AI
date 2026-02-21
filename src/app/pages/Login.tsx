import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { Shield, Mail, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import api from '../utils/api';

// Declare google global for TypeScript
declare global {
  interface Window {
    google: any;
  }
}

export function Login() {
  const [email, setEmail] = useState('admin@enterprise.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const tokenClientRef = useRef<any>(null);

  useEffect(() => {
    // Load Google GSI client script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (clientId && window.google) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (response: any) => {
            if (response.error) {
              setError(`Google Login Error: ${response.error}`);
              setGoogleLoading(false);
              return;
            }

            try {
              setGoogleLoading(true);
              const result = await api.auth.googleLogin(response.access_token) as any;
              localStorage.setItem('auth_token', result.token);
              localStorage.setItem('user_email', result.user?.email);
              toast.success('Signed in with Google successfully');
              navigate('/dashboard');
            } catch (err: any) {
              setError(err.message || 'Google login failed.');
              toast.error('Google login failed');
            } finally {
              setGoogleLoading(false);
            }
          },
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [navigate]);

  const handleGoogleLogin = () => {
    if (tokenClientRef.current) {
      setGoogleLoading(true);
      setError('');
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } else {
      toast.error('Google Sign-In is not initialized. Please check your Client ID.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.auth.login(email, password) as any;
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_email', result.user?.email || email);
      toast.success('Signed in successfully');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 mb-4 shadow-lg">
            <Shield className="size-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Sentinel Shield</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Enterprise Security Middleware</p>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Secure your LLM infrastructure with layered defenses.</p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Access your security workspace and monitoring logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="size-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-4"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="size-4" />
                    Password
                  </Label>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5" disabled={loading || googleLoading}>
                {loading ? 'Signing in...' : 'Sign in to Console'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-center text-slate-600 dark:text-slate-400 mb-4 font-medium">OR CONTINUE WITH SSO</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="text-sm" onClick={handleGoogleLogin} disabled={loading || googleLoading}>
                  <span className="text-lg mr-2">G</span> {googleLoading ? 'Connecting...' : 'Google'}
                </Button>
                <Button variant="outline" className="text-sm">
                  <span>🔐</span> Okta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>
            New to Sentinel?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium bg-transparent border-none p-0 cursor-pointer"
            >
              Create an account
            </button>
          </p>
        </div>

        <div className="mt-8 pt-8 text-center text-xs text-slate-400 dark:text-slate-600 space-y-1">
          <div className="flex items-center justify-center gap-8">
            <a href="#" className="hover:text-slate-300">DOCUMENTATION</a>
            <a href="#" className="hover:text-slate-300">API KEYS</a>
            <a href="#" className="hover:text-slate-300">TRUST CENTER</a>
            <a href="#" className="hover:text-slate-300">STATUS</a>
          </div>
          <p className="mt-4">SECURE_PROXY_AUTH_V2 / ENCRYPTION_AES_256 / SESSION_ISOLATED</p>
          <p>SENTINEL SHIELD © {new Date().getFullYear()} • SECURED ARCHITECTURE</p>
        </div>
      </div>
    </div>
  );
}
