import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Globe } from 'lucide-react';
import SocialLoginButtons from './SocialLoginButtons';

export default function LoginLeftPanel() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/home';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load remembered credentials on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    const wasRemembered = localStorage.getItem('rememberMe') === 'true';
    if (wasRemembered && rememberedEmail) {
      setEmail(rememberedEmail);
      setRemember(true);
      if (rememberedPassword) {
        setPassword(rememberedPassword);
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      if (remember) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        localStorage.removeItem('rememberMe');
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link to="/" className="absolute top-4 left-4 flex items-center space-x-2 hover:opacity-80 transition-opacity z-10" data-test="login-logo">
        <Globe className="h-6 w-6 text-orange-500" />
        <h2 className="text-lg font-bold text-gray-900">GermanGains</h2>
      </Link>
      <div
        className="w-full max-w-md mx-auto transform scale-75 origin-top transition duration-300 mt-24"
        data-test="login-form-container"
      >
        <div className="relative inline-block">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 bg-clip-text text-transparent mb-2 leading-tight">
            Welcome Back
          </h1>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full"></div>
        </div>
        <p className="text-gray-600 mt-3 font-medium">
          Ready to continue your journey? 
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" data-test="login-form">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-test="login-error">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <Input
              id="email"
              data-test="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="demo@germangains.com"
              className="pl-12 h-12 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <Input
              id="password"
              data-test="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-12 pr-12 h-12 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition"
              required
            />
            <button
              type="button"
              data-test="login-toggle-password"
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              data-test="login-remember"
              checked={remember}
              onCheckedChange={checked => setRemember(checked === true)}
            />
            <Label htmlFor="remember" className="text-sm text-gray-600">
              Remember me
            </Label>
          </div>
          <Link to="#" className="text-sm text-orange-600 hover:underline" data-test="login-forgot-password">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          data-test="login-submit"
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-[1.02] focus:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Signing In...</span>
            </div>
          ) : (
            'Sign In'
          )}
        </Button>

        {/* Social Login Buttons */}
        <div data-test="login-social-buttons">
          <SocialLoginButtons />
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-orange-600 hover:underline" data-test="login-signup-link">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
