import { useState } from 'react';

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  message: string;
  user?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface UseRegisterResult {
  register: (data: RegisterData) => Promise<RegisterResponse>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useRegister(): UseRegisterResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const register = async (data: RegisterData): Promise<RegisterResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Sending registration data:', data); 
      
      const response = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type')); 

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        
        let errorMessage = 'Server error occurred';
        
        if (textResponse.includes('Password min 8 chars')) {
          errorMessage = 'Password must be at least 8 characters long';
        } else if (textResponse.includes('Validation failed')) {
          const match = textResponse.match(/Validation failed: \[{[^}]*"message":"([^"]*)"[^}]*}\]/);
          if (match && match[1]) {
            errorMessage = match[1];
          } else {
            errorMessage = 'Validation failed. Please check your input.';
          }
        } else if (textResponse.includes('Unique constraint failed')) {
          if (textResponse.includes('username')) {
            errorMessage = 'Username already exists. Please choose a different username.';
          } else if (textResponse.includes('email')) {
            errorMessage = 'Email already exists. Please use a different email address.';
          } else {
            errorMessage = 'This information already exists. Please try different values.';
          }
        }
        
        throw new Error(errorMessage);
      }

      const payload = await response.json();
      console.log('Response payload:', payload); 

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        
        if (payload.message) {
          errorMessage = payload.message;
        } else if (payload.error) {
          errorMessage = payload.error;
        } else if (typeof payload === 'string') {
          errorMessage = payload;
        }
        
        if (errorMessage.includes('Unique constraint failed') && errorMessage.includes('username')) {
          errorMessage = 'Username already exists. Please choose a different username.';
        } else if (errorMessage.includes('Unique constraint failed') && errorMessage.includes('email')) {
          errorMessage = 'Email already exists. Please use a different email address.';
        }
        
        throw new Error(errorMessage);
      }

      return payload;
      
    } catch (err: any) {
      let errorMessage = 'Registration failed';
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please check if the server is running.';
      } else if (err.message.includes('JSON')) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      console.error('Registration error:', err); 
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error, clearError };
}