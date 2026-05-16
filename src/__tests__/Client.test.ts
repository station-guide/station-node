import axios from 'axios';

jest.mock('axios');

import Client from '../index';

const mockedPost = axios.post as jest.Mock;

describe('Client basic tests', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockedPost.mockReset();
    Client.setApiKey('');
    Client.setDebug(false);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
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

  it('swallows request errors when debug mode is disabled', async () => {
    mockedPost.mockRejectedValueOnce(new Error('network error'));

    await expect(Client.trackCount('page_view')).resolves.toBeUndefined();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('logs request errors when debug mode is enabled', async () => {
    const error = new Error('network error');
    mockedPost.mockRejectedValueOnce(error);
    Client.setDebug(true);

    await Client.trackCount('page_view');

    expect(consoleWarnSpy).toHaveBeenCalledWith('[station-node] Failed to send event', error);
  });
});
