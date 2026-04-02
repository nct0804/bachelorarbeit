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
  const { register, loading, error, clearError } = useRegister();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
  const isPasswordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const clearFeedback = () => {
    if (error) {
      clearError();
    }

    if (notification.show) {
      setNotification((previousNotification) =>
        previousNotification.show
          ? { ...previousNotification, show: false }
          : previousNotification
      );
    }
  };

  const handleFieldChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      clearFeedback();
      setter(event.target.value);
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    clearFeedback();

    if (!e.currentTarget.reportValidity() || isPasswordMismatch) {
      return;
    }

    try {
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedUsername = username.trim();
      const registrationData = {
        email: email.trim(),
        password,
        ...(trimmedUsername
          ? { username: trimmedUsername.toLowerCase() }
          : {}),
        ...(trimmedFirstName ? { firstName: trimmedFirstName } : {}),
        ...(trimmedLastName ? { lastName: trimmedLastName } : {}),
      };

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
        message:
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
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
                    onChange={handleFieldChange(setFirstName)}
                    placeholder="John"
                    className="pl-10 h-9 md:h-10 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition text-sm"
                    autoComplete="given-name"
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
                    onChange={handleFieldChange(setLastName)}
                    placeholder="Doe"
                    className="pl-10 h-9 md:h-10 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition text-sm"
                    autoComplete="family-name"
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
                  onChange={handleFieldChange(setUsername)}
                  placeholder="johndoe"
                  minLength={3}
                  pattern="[a-zA-Z0-9_]+"
                  title="Username must be at least 3 characters and contain only letters, numbers, and underscores"
                  className="pl-10 h-9 md:h-10 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition text-sm"
                  autoComplete="username"
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
                  onChange={handleFieldChange(setEmail)}
                  placeholder="you@example.com"
                  className="pl-10 h-9 md:h-10 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition text-sm"
                  autoComplete="email"
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
                  onChange={handleFieldChange(setPassword)}
                  placeholder="••••••••"
                  minLength={8}
                  aria-invalid={isPasswordMismatch || undefined}
                  className="pl-10 pr-10 h-9 md:h-10 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition text-sm"
                  autoComplete="new-password"
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

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <Input
                  id="confirmPassword"
                  data-test="register-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleFieldChange(setConfirmPassword)}
                  placeholder="••••••••"
                  minLength={8}
                  aria-invalid={isPasswordMismatch || undefined}
                  className="pl-10 pr-10 h-9 md:h-10 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg hover:border-gray-300 bg-white text-gray-800 placeholder-gray-400 transition text-sm"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  data-test="register-toggle-confirm-password"
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
              {isPasswordMismatch && (
                <p className="text-xs text-red-600 mt-1" data-test="register-confirm-password-error">
                  Passwords must match
                </p>
              )}
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
