import type { Message } from './type';

// Mock implementation of the addMessage function
export const addMessage = async (message: Message): Promise<void> => {
    console.log('API call: addMessage', message);
    // In a real implementation, this would send the message to the server
    return Promise.resolve();
};

// Other API functions would be implemented here 