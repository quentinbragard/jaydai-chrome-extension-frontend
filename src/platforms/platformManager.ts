import { handleChatgptConversationList } from './chatgpt/handleChatgptConversationList';


export function handleConversationList(event: CustomEvent): Promise<void> {
    console.log('=========================handleConversationList', event);
    const platform = event.detail.platform;
    const responseBody = event.detail.responseBody;
    if (platform === 'chatgpt') {
        return handleChatgptConversationList(responseBody.items);
    }
    if (platform === 'claude') {
        console.log('=========================handleClaudeConversationList', responseBody);
    }
    return Promise.resolve();
}