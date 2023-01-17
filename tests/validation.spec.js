const axios = require('axios').default;

const axiosOptions = {
    validateStatus: (status) => {
        return status >= 100 && status < 500;
    },
};

const url = `http://web:${process.env.API_PORT}/campaigns`;

describe('Validation', () => {
    describe('Bad use case', () => {
        let response = { status: 0, data: undefined };

        beforeAll(async () => {
            response = await axios.post(
                url,
                {
                    type: 'test',
                    name: 'Test sms campaign',
                    message: 'Hello there this is the BySide Coding Exercise',
                    sender: {
                        name: 'BySide',
                        phone: "+351112",
                    }
                },
                axiosOptions
            );
        });

        test('should have a success status code', () => {
            expect(response.status.toString()).toMatch(/4[0-9][0-9]/);
        });

        test('should have a body', () => {
            expect(response.data).not.toBeUndefined();
        });
    });

    describe('Success use case', () => {
        let response = { status: 0, data: undefined };

        beforeAll(async () => {
            response = await axios.post(
                url,
                {
                    type: 'sms',
                    name: 'Test sms campaign',
                    message: 'Hello there this is the BySide Coding Exercise',
                    sender: {
                        name: 'BySide',
                        phone: "+351112",
                    }
                },
                axiosOptions
            );
        });

        test('should have a success status code', () => {
            expect(response.status.toString()).toMatch(/2[0-9][0-9]/);
        });

        test('should have a body', () => {
            expect(response.data).not.toBeUndefined();
            expect(response.data).toBe('test');
        });
    });
});
