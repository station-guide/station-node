import request from 'request-promise-native';

jest.mock('request-promise-native');

import Client from '../index';

const mockedRequest = request as jest.Mock<typeof request>;

describe('Client basic tests', () => {
  it('should just work', async () => {
    mockedRequest.mockImplementation((options) => options);
    Client.trackCount('test', 'test', 1);
  });
});
