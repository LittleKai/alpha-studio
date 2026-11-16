import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  acquireLedStudioSessionTicket,
  resolveLedStudioTicketGate
} from './ledStudioService';

describe('acquireLedStudioSessionTicket', () => {
  const origFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it('posts to same-origin /api/led-studio/session-ticket with credentials: include and Bearer token', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { issued: true, expiresAt: '2026-11-16T12:00:00.000Z', maxAge: 900, mode: 'user' }
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    globalThis.fetch = mockFetch;

    const res = await acquireLedStudioSessionTicket({ token: 'jwt_123' }, { allowDevFallback: false });
    expect(res.ok).toBe(true);
    expect(res.issued).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/led-studio/session-ticket');
    expect(init.credentials).toBe('include');
    expect(init.headers.Authorization).toBe('Bearer jwt_123');
  });

  it('returns requiresPassword without mounting iframe when share link is password-protected', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { issued: false, requiresPassword: true, passwordProtected: true, title: 'VIP Stage' }
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    const res = await acquireLedStudioSessionTicket({ shareToken: 'sh_1' }, { allowDevFallback: false });
    expect(res.ok).toBe(true);
    expect(res.issued).toBe(false);
    expect(res.requiresPassword).toBe(true);
    expect(res.title).toBe('VIP Stage');
  });

  it('surfaces error code for invalid or expired shareToken without falling back in prod mode', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          code: 'SHARE_PRO_EXPIRED',
          message: 'Expired'
        }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    );
    globalThis.fetch = mockFetch;

    const res = await acquireLedStudioSessionTicket({ shareToken: 'sh_exp' }, { allowDevFallback: false });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.code).toBe('SHARE_PRO_EXPIRED');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('resolveLedStudioTicketGate', () => {
  it('keeps active ?share= and user 3D sessions alive on transient NETWORK_ERROR or 5xx during silentRenewal', () => {
    const netErr = { ok: false, status: 0, issued: false, code: 'NETWORK_ERROR' };
    expect(
      resolveLedStudioTicketGate(netErr, { hasShareToken: true, silentRenewal: true, currentGateState: 'ready' })
    ).toEqual({ nextGateState: 'ready', ok: false, passwordError: false });

    const gateway503 = { ok: false, status: 503, issued: false, code: 'TICKET_REJECTED' };
    expect(
      resolveLedStudioTicketGate(gateway503, { hasShareToken: true, silentRenewal: true, currentGateState: 'ready' })
    ).toEqual({ nextGateState: 'ready', ok: false, passwordError: false });
  });

  it('transitions share password, expired PRO, and issued states accurately', () => {
    expect(
      resolveLedStudioTicketGate(
        { ok: true, status: 200, issued: false, requiresPassword: true, title: 'Arena' },
        { hasShareToken: true, silentRenewal: false, currentGateState: 'verifying' }
      )
    ).toEqual({ nextGateState: 'password_required', ok: false, passwordError: false, title: 'Arena' });

    expect(
      resolveLedStudioTicketGate(
        { ok: false, status: 401, issued: false, code: 'INVALID_SHARE_PASSWORD' },
        { hasShareToken: true, silentRenewal: false, currentGateState: 'verifying' }
      )
    ).toEqual({ nextGateState: 'password_required', ok: false, passwordError: true });

    expect(
      resolveLedStudioTicketGate(
        { ok: false, status: 403, issued: false, code: 'SHARE_PRO_EXPIRED' },
        { hasShareToken: true, silentRenewal: true, currentGateState: 'ready' }
      )
    ).toEqual({ nextGateState: 'share_pro_expired', ok: false, passwordError: false });

    expect(
      resolveLedStudioTicketGate(
        { ok: true, status: 200, issued: true },
        { hasShareToken: true, silentRenewal: false, currentGateState: 'verifying' }
      )
    ).toEqual({ nextGateState: 'ready', ok: true, passwordError: false });
  });
});
