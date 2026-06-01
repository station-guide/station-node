import axios from 'axios';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';

type EventType = 'count' | 'value';
type HttpError = {
  response?: {
    status?: number;
    headers?: Record<string, string | number | undefined>;
  };
};

export interface StationClient {
  setApiKey(apiKey: string): void;
  setDebug(enabled: boolean): void;
  trackCount(statName: string, value?: number): Promise<void>;
  trackValue(statName: string, value: number): Promise<void>;
  captureCount(statName: string, value?: number): void;
  captureValue(statName: string, value: number): void;
}

const API_URI = 'https://api.station.guide';
const COUNT_URL = `${API_URI}/v1/events/count`;
const VALUE_URL = `${API_URI}/v1/events/value`;
const DEFAULT_TIMEOUT_MS = 2500;
const DEFAULT_RETRY_AFTER_MS = 1000;

class Client implements StationClient {
  private apiKey: string = (process.env.hasOwnProperty('STATION_API_KEY') && process.env.STATION_API_KEY) || '';
  private debug: boolean = false;
  private pauseRequestsUntil = 0;
  private readonly http = axios.create({
    timeout: DEFAULT_TIMEOUT_MS,
    httpAgent: new HttpAgent({ keepAlive: true }),
    httpsAgent: new HttpsAgent({ keepAlive: true }),
  });

  public setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.pauseRequestsUntil = 0;
  }

  public setDebug(enabled: boolean) {
    this.debug = enabled;
  }

  public async trackCount(statName: string, value = 1): Promise<void> {
    await this.sendEvent('count', statName, value);
  }

  public async trackValue(statName: string, value: number): Promise<void> {
    await this.sendEvent('value', statName, value);
  }

  public captureCount(statName: string, value = 1): void {
    void this.trackCount(statName, value);
  }

  public captureValue(statName: string, value: number): void {
    void this.trackValue(statName, value);
  }

  private async sendEvent(eventType: EventType, statName: string, value: number): Promise<void> {
    if (this.isPaused()) {
      this.logDebug('[station-node] Event skipped while backing off after rate limit');
      return;
    }

    try {
      await this.postEvent(eventType, statName, value);
    } catch (error) {
      if (this.handleRateLimit(error)) return;
      if (!this.shouldRetry(error)) {
        this.handleError(error);
        return;
      }

      await this.sleep(this.retryDelayMs());

      if (this.isPaused()) return;

      try {
        await this.postEvent(eventType, statName, value);
      } catch (retryError) {
        if (this.handleRateLimit(retryError)) return;
        this.handleError(retryError);
      }
    }
  }

  private async postEvent(eventType: EventType, statName: string, value: number): Promise<void> {
    await this.http.post(eventType === 'count' ? COUNT_URL : VALUE_URL, this.eventPayload(statName, value));
  }

  private eventPayload(statName: string, value: number) {
    return {
      apiKey: this.apiKey,
      statName,
      value,
    };
  }

  private handleRateLimit(error: unknown) {
    if (this.statusCode(error) !== 429) return false;

    this.pauseRequestsUntil = Date.now() + this.retryAfterMs(error);
    this.logDebug('[station-node] Rate limited by Station; backing off');
    return true;
  }

  private shouldRetry(error: unknown) {
    const status = this.statusCode(error);
    return status === undefined || status >= 500;
  }

  private statusCode(error: unknown) {
    return (error as HttpError | undefined)?.response?.status;
  }

  private retryAfterMs(error: unknown) {
    const headers = (error as HttpError | undefined)?.response?.headers ?? {};
    const retryAfter = headers['retry-after'] ?? headers['Retry-After'];
    if (typeof retryAfter === 'number') return Math.max(0, retryAfter * 1000);
    if (typeof retryAfter !== 'string') return DEFAULT_RETRY_AFTER_MS;

    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

    const date = Date.parse(retryAfter);
    return Number.isFinite(date) ? Math.max(0, date - Date.now()) : DEFAULT_RETRY_AFTER_MS;
  }

  private isPaused() {
    return Date.now() < this.pauseRequestsUntil;
  }

  private retryDelayMs() {
    return 25 + Math.floor(Math.random() * 75);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleError(error: unknown) {
    this.logDebug('[station-node] Failed to send event', error);
  }

  private logDebug(message: string, error?: unknown) {
    if (!this.debug) return;
    if (error === undefined) console.warn(message);
    else console.warn(message, error);
  }
}

const Station: StationClient = new Client();

export const setApiKey = Station.setApiKey.bind(Station);
export const setDebug = Station.setDebug.bind(Station);
export const trackCount = Station.trackCount.bind(Station);
export const trackValue = Station.trackValue.bind(Station);
export const captureCount = Station.captureCount.bind(Station);
export const captureValue = Station.captureValue.bind(Station);

export default Station;
