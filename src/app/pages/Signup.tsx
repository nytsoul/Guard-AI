import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { Shield, Mail, Lock, User } from 'lucide-react';
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

export function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                            setError(err.message || 'Google signup failed.');
                            toast.error('Google signup failed');
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

    const handleGoogleSignup = () => {
        if (tokenClientRef.current) {
            setGoogleLoading(true);
            setError('');
            tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
        } else {
            toast.error('Google Sign-In is not initialized. Please check your Client ID.');
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await api.auth.signup({ name, email, password }) as any;
            localStorage.setItem('auth_token', result.token);
            localStorage.setItem('user_email', result.user?.email || email);
            toast.success('Account created successfully');
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
            toast.error('Signup failed');
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
                    <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Join the community protecting the future of AI.</p>
                </div>

                <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle>Create an account</CardTitle>
                        <CardDescription>Get started with Sentinel Shield today.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <User className="size-4" />
                                    Full Name
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="size-4" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2">
                                    <Lock className="size-4" />
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a password"
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
                                {loading ? 'Creating account...' : 'Create Account'}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-center text-slate-600 dark:text-slate-400 mb-4 font-medium">OR SIGN UP WITH SSO</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="text-sm" onClick={handleGoogleSignup} disabled={loading || googleLoading}>
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
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium bg-transparent border-none p-0 cursor-pointer"
                        >
                            Log in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
