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

      const textResponse = await response.text();
      const contentType = response.headers.get('content-type');
      const canParseJson = contentType && contentType.includes('application/json');
      let payload: any = null;
      
      if (canParseJson) {
        payload = textResponse ? JSON.parse(textResponse) : null;
      } else {
        try {
          payload = textResponse ? JSON.parse(textResponse) : null;
        } catch {
          payload = null;
        }
      }
      
      if (!canParseJson) {
        console.error('Non-JSON response:', textResponse);
      }
      console.log('Response payload:', payload); 

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        
        if (payload?.message) {
          errorMessage = payload.message;
        } else if (payload?.error) {
          errorMessage = payload.error;
        } else if (Array.isArray(payload?.errors) && payload.errors[0]?.message) {
          errorMessage = payload.errors[0].message;
        } else if (typeof payload === 'string') {
          errorMessage = payload;
        } else if (textResponse) {
          errorMessage = textResponse;
        }
        
        if (errorMessage.includes('<!DOCTYPE html') || errorMessage.includes('<html')) {
          const bodyMatch = errorMessage.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          const bodyContent = bodyMatch ? bodyMatch[1] : errorMessage;
          const preMatch = bodyContent.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
          const rawText = preMatch ? preMatch[1] : bodyContent;
          const cleaned = rawText
            .replace(/<br\s*\/?\s*>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .trim();
          
          if (cleaned) {
            errorMessage = cleaned;
          } else {
            errorMessage = 'Server error occurred';
          }
        }
        
        if (errorMessage.includes("Can't reach database server") || errorMessage.includes('PrismaClientInitializationError')) {
          errorMessage = 'Cannot connect to database. Please start the database and try again.';
        }
        
        if (errorMessage.includes('Password min 8 chars')) {
          errorMessage = 'Password must be at least 8 characters long';
        } else if (errorMessage.includes('E-mail already in use') || errorMessage.includes('Email already in use')) {
          errorMessage = 'Email already exists. Please use a different email address.';
        } else if (errorMessage.includes('Validation failed')) {
          const match = errorMessage.match(/Validation failed: \[{[^}]*"message":"([^"]*)"[^}]*}\]/);
          if (match && match[1]) {
            errorMessage = match[1];
          } else {
            errorMessage = 'Validation failed. Please check your input.';
          }
        } else if (errorMessage.includes('Unique constraint failed')) {
          if (errorMessage.includes('username')) {
            errorMessage = 'Username already exists. Please choose a different username.';
          } else if (errorMessage.includes('email')) {
            errorMessage = 'Email already exists. Please use a different email address.';
          } else {
            errorMessage = 'This information already exists. Please try different values.';
          }
        }
        
        throw new Error(errorMessage);
      }

      if (payload === null && textResponse) {
        throw new Error('Unexpected server response. Please try again.');
      }

      return payload ?? ({} as RegisterResponse);
      
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
