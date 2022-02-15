import axios from 'axios';

class Client {
  private apiUri: string = `https://api.station.guide`;

  public async trackCount(apiKey: string, name: string, value: number): Promise<void> {
    try {
      await axios.post(`${this.apiUri}/v1/events/count`, { apiKey, name, value });
    } catch (_) {
      // Do nothing really
      // for now...
    }
  }
}

export default new Client();
