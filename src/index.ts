import axios from 'axios';

class Client {
  private apiUri: string = `https://api.station.guide`;
  private apiKey: string = (process.env.hasOwnProperty('STATION_API_KEY') && process.env.STATION_API_KEY) || '';
  private debug: boolean = false;

  public setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  public setDebug(enabled: boolean) {
    this.debug = enabled;
  }

  public async trackCount(statName: string, value = 1): Promise<void> {
    try {
      await axios.post(`${this.apiUri}/v1/events/count`, { apiKey: this.apiKey, statName, value });
    } catch (error) {
      this.handleError(error);
    }
  }

  public async trackValue(statName: string, value: number): Promise<void> {
    try {
      await axios.post(`${this.apiUri}/v1/events/value`, { apiKey: this.apiKey, statName, value });
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown) {
    if (this.debug) {
      console.warn('[station-node] Failed to send event', error);
    }
  }
}

export default new Client();
