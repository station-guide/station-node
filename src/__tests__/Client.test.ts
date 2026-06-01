const mockPost = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      post: mockPost,
    })),
  },
}));

import axios from 'axios';
import Client, { trackCount, type StationClient } from '../index';

const mockedCreate = axios.create as jest.Mock;
const mockedPost = mockPost;

describe('Client basic tests', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockedPost.mockReset();
    mockedPost.mockResolvedValue({});
    Client.setApiKey('');
    Client.setDebug(false);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    jest.useRealTimers();
  });

  it('creates a keep-alive http client with a short timeout', () => {
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 2500,
        httpAgent: expect.any(Object),
        httpsAgent: expect.any(Object),
      }),
    );
  });

  it('tracks count events with the configured API key and default value', async () => {
    Client.setApiKey('test-api-key');

    await Client.trackCount('page_view');

    expect(mockedPost).toHaveBeenCalledWith('https://api.station.guide/v1/events/count', {
      apiKey: 'test-api-key',
      statName: 'page_view',
      value: 1,
    });
  });

  it('exports a typed singleton client', () => {
    const typedClient: StationClient = Client;

    expect(typedClient).toBe(Client);
  });

  it('offers named function exports', async () => {
    Client.setApiKey('test-api-key');

    await trackCount('page_view');

    expect(mockedPost).toHaveBeenCalledWith('https://api.station.guide/v1/events/count', {
      apiKey: 'test-api-key',
      statName: 'page_view',
      value: 1,
    });
  });

  it('tracks count events with an explicit value', async () => {
    Client.setApiKey('test-api-key');

    await Client.trackCount('signup', 3);

    expect(mockedPost).toHaveBeenCalledWith('https://api.station.guide/v1/events/count', {
      apiKey: 'test-api-key',
      statName: 'signup',
      value: 3,
    });
  });

  it('tracks value events', async () => {
    Client.setApiKey('test-api-key');

    await Client.trackValue('checkout_total', 24.95);

    expect(mockedPost).toHaveBeenCalledWith('https://api.station.guide/v1/events/value', {
      apiKey: 'test-api-key',
      statName: 'checkout_total',
      value: 24.95,
    });
  });

  it('offers fire-and-forget count tracking', () => {
    Client.setApiKey('test-api-key');

    Client.captureCount('page_view');

    expect(mockedPost).toHaveBeenCalledWith('https://api.station.guide/v1/events/count', {
      apiKey: 'test-api-key',
      statName: 'page_view',
      value: 1,
    });
  });

  it('offers fire-and-forget value tracking', () => {
    Client.setApiKey('test-api-key');

    Client.captureValue('api_latency_ms', 142);

    expect(mockedPost).toHaveBeenCalledWith('https://api.station.guide/v1/events/value', {
      apiKey: 'test-api-key',
      statName: 'api_latency_ms',
      value: 142,
    });
  });

  it('swallows request errors when debug mode is disabled', async () => {
    mockedPost.mockRejectedValueOnce(new Error('network error'));

    await expect(Client.trackCount('page_view')).resolves.toBeUndefined();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('logs request errors when debug mode is enabled', async () => {
    const error = new Error('network error');
    mockedPost.mockRejectedValueOnce(error).mockRejectedValueOnce(error);
    Client.setDebug(true);

    await Client.trackCount('page_view');

    expect(consoleWarnSpy).toHaveBeenCalledWith('[station-node] Failed to send event', error);
  });

  it('retries one transient network failure', async () => {
    jest.useFakeTimers();
    mockedPost.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce({});

    const request = Client.trackCount('page_view');
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(100);
    await request;

    expect(mockedPost).toHaveBeenCalledTimes(2);
  });

  it('does not retry client errors', async () => {
    mockedPost.mockRejectedValueOnce({ response: { status: 400 } });

    await Client.trackCount('page_view');

    expect(mockedPost).toHaveBeenCalledTimes(1);
  });

  it('backs off after rate limit responses', async () => {
    mockedPost.mockRejectedValueOnce({ response: { status: 429, headers: { 'retry-after': '2' } } });

    await Client.trackCount('page_view');
    mockedPost.mockClear();
    await Client.trackCount('page_view');

    expect(mockedPost).not.toHaveBeenCalled();
  });
});
