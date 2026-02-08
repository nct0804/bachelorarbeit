/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock Clerk hooks used in AuthProvider
vi.mock('@clerk/clerk-react', () => {
  return {
    __esModule: true,
    ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useUser: () => ({ user: null, isLoaded: true, isSignedIn: false }),
    useAuth: () => ({ signOut: vi.fn(), getToken: vi.fn() }),
  };
});

import { AuthProvider } from './hooks/useAuth';
import App from './App';

// Mock API responses
const handlers = [
  rest.get('http://localhost:3000/api/users/me', (req, res, ctx) => {
    return res(
      ctx.status(401),
      ctx.json({ message: 'Unauthorized' })
    );
  }),
  rest.post('http://localhost:3000/api/users/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: { id: 1, name: 'Test User', email: 'test@example.com' }
        }
      })
    );
  }),
];

const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

test('renders without crashing', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
}); 