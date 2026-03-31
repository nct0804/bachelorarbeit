/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import RegisterLeftPanel from './RegisterLeftPanel';
import { useRegister } from '../../hooks/useRegister';

const mockNavigate = vi.fn();
const mockRegister = vi.fn();
const mockClearError = vi.fn();

vi.mock('../../hooks/useRegister', () => ({
  useRegister: vi.fn(),
}));

vi.mock('../notification/notificationRegister', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('./SocialLoginButtons', () => ({
  __esModule: true,
  default: () => <div data-test="register-social-buttons-mock" />,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseRegister = vi.mocked(useRegister);

const renderRegisterLeftPanel = () =>
  render(
    <MemoryRouter>
      <RegisterLeftPanel />
    </MemoryRouter>
  );

beforeEach(() => {
  mockNavigate.mockReset();
  mockRegister.mockReset();
  mockClearError.mockReset();
  mockRegister.mockResolvedValue({ message: 'Registration Successful' });
  mockUseRegister.mockReturnValue({
    register: mockRegister,
    loading: false,
    error: null,
    clearError: mockClearError,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RegisterLeftPanel', () => {
  test('marks only email, password, and confirm password as required', () => {
    const { container } = renderRegisterLeftPanel();

    const firstNameInput = container.querySelector(
      '[data-test="register-first-name"]'
    );
    const lastNameInput = container.querySelector(
      '[data-test="register-last-name"]'
    );
    const usernameInput = container.querySelector(
      '[data-test="register-username"]'
    );
    const emailInput = container.querySelector('[data-test="register-email"]');
    const passwordInput = container.querySelector(
      '[data-test="register-password"]'
    );
    const confirmPasswordInput = container.querySelector(
      '[data-test="register-confirm-password"]'
    );

    expect(firstNameInput).toBeInTheDocument();
    expect(lastNameInput).toBeInTheDocument();
    expect(usernameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();

    expect(firstNameInput).not.toBeRequired();
    expect(lastNameInput).not.toBeRequired();
    expect(usernameInput).not.toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(confirmPasswordInput).toBeRequired();
  });

  test('prevents submission when password confirmation does not match', async () => {
    const user = userEvent.setup();
    renderRegisterLeftPanel();

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123');
    await user.type(
      screen.getByLabelText(/confirm password/i),
      'Password456'
    );
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(mockRegister).not.toHaveBeenCalled();
    expect(
      screen.getByText('Passwords must match')
    ).toBeInTheDocument();
  });

  test('submits with optional profile fields left empty when passwords match', async () => {
    const user = userEvent.setup();
    renderRegisterLeftPanel();

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123');
    await user.type(
      screen.getByLabelText(/confirm password/i),
      'Password123'
    );
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password123',
      });
    });
  });
});
