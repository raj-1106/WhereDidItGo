import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as apiModule from '../api';

jest.mock('../api', () => ({
  login: jest.fn(),
  register: jest.fn(),
  tokenStore: {
    get: jest.fn(() => null),
    set: jest.fn(),
  },
}));

const mockedApi = apiModule as jest.Mocked<typeof apiModule>;

beforeEach(() => {
  jest.clearAllMocks();
  (mockedApi.tokenStore.get as jest.Mock).mockReturnValue(null);
});

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe('AuthContext', () => {
  it('main case: login stores the token and marks the user authenticated', async () => {
    mockedApi.login.mockResolvedValue({ token: 'abc123', user: { id: '1', email: 'a@b.com' } });
    const { result } = renderAuth();

    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.login('a@b.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('a@b.com');
    expect(mockedApi.tokenStore.set).toHaveBeenCalledWith('abc123');
  });

  it('failure case: a rejected login leaves the user unauthenticated and does not store a token', async () => {
    mockedApi.login.mockRejectedValue({ response: { data: { error: 'Invalid email or password' } } });
    const { result } = renderAuth();

    await act(async () => {
      await expect(result.current.login('a@b.com', 'wrong')).rejects.toBeDefined();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(mockedApi.tokenStore.set).not.toHaveBeenCalled();
  });

  it('edge case: logout clears token and user state', async () => {
    mockedApi.login.mockResolvedValue({ token: 'abc123', user: { id: '1', email: 'a@b.com' } });
    const { result } = renderAuth();

    await act(async () => {
      await result.current.login('a@b.com', 'password123');
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(mockedApi.tokenStore.set).toHaveBeenCalledWith(null);
  });

  it('main case: a wdig:unauthorized event (dispatched by the axios interceptor on a stale token) logs the user out', async () => {
    mockedApi.login.mockResolvedValue({ token: 'abc123', user: { id: '1', email: 'a@b.com' } });
    const { result } = renderAuth();

    await act(async () => {
      await result.current.login('a@b.com', 'password123');
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('wdig:unauthorized'));
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
  });
});
