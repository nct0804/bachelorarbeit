import React, { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegister } from '../../hooks/useRegister';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import Notification from '../notification/notificationRegister';
import SocialLoginButtons from './SocialLoginButtons';

export default function RegisterLeftPanel() {
  const { register, loading, error } = useRegister();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !username.trim()) {
      return; 
    }
    
    if (password.length < 8) {
      return; 
    }
    
    if (username.length < 3) {
      return; 
    }
    
    try {
      const registrationData = {
        email: email.trim(),
        password,
        username: username.trim().toLowerCase(), 
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      
      console.log('Attempting registration with:', registrationData);
      
      await register(registrationData);
      
      setNotification({
        show: true,
        type: 'success',
        title: 'Registration Successful!',
        message: 'Your account has been created. Redirecting to login page...',
      });
      
      setTimeout(() => {
        navigate('/login', { 
          replace: true,
          state: { message: 'Registration successful! Please log in.' }
        });
      }, 2000);
      
    } catch (err) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Registration Failed',
        message: error || 'Something went wrong. Please try again.',
      });
      console.error('Registration failed:', err);
    }
  };

  return (
    <>
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
      
      <div className="w-full h-full flex items-center scale-80 justify-center p-4 md:p-6 lg:p-8" data-test="register-form-container">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <h1 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 bg-clip-text text-transparent mb-1 leading-tight">
                Create an Account
              </h1>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full"></div>
            </div>
            <p className="text-gray-600 mt-2 font-medium text-sm md:text-base">Sign up to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4" data-test="register-form">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3" data-test="register-error">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  </div>
                  <Input
                    id="firstName"
                    data-test="register-first-name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="John"
                    className="pl-10 h-9 md:h-10 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  </div>
                  <Input
                    id="lastName"
                    data-test="register-last-name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="pl-10 h-9 md:h-10 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <Input
                  id="username"
                  data-test="register-username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="johndoe"
                  minLength={3}
                  pattern="[a-zA-Z0-9_]+"
                  title="Username must be at least 3 characters and contain only letters, numbers, and underscores"
                  className="pl-10 h-9 md:h-10 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <Input
                  id="email"
                  data-test="register-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 h-9 md:h-10 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <Input
                  id="password"
                  data-test="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  className="pl-10 pr-10 h-9 md:h-10 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition text-sm"
                  required
                />
                <button
                  type="button"
                  data-test="register-toggle-password"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
            </div>

            <Button
              type="submit"
              data-test="register-submit"
              className="w-full h-9 md:h-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-[1.02] focus:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Social Login Buttons */}
            <div data-test="register-social-buttons">
              <SocialLoginButtons />
            </div>

            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-600 hover:underline" data-test="register-login-link">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
} 
