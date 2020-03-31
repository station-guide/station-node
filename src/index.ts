import request from 'request-promise-native';

class Client {
  private apiUri: string = `https://api.station.guide`;

  public async trackCount(apiKey: string, name: string, value: number): Promise<void> {
    try {
      await request({
        json: {
          apiKey,
          name,
          value,
        },
        method: 'POST',
        simple: false,
        uri: this.apiUri,
      });
    } catch (_) {
      // Do nothing really
      // for now...
    }
  }
}

export default new Client();
