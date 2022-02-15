import axios from 'axios';

jest.mock('axios');

import Client from '../index';

const mockedRequest = axios.get as jest.Mock<any>;

describe('Client basic tests', () => {
  it('should just work', async () => {
    mockedRequest.mockImplementation((options) => options);
    Client.trackCount('test', 'test', 1);
  });
});
