import { handleChatgptConversationList } from './chatgpt/handleChatgptConversationList';
import { handleClaudeConversationList } from './claude/handleClaudeConversationList';
import { handleChatgptSpecificConversation } from './chatgpt/handleChatgptSpecificConversation';
import { handleClaudeSpecificConversation } from './claude/handleClaudeSpecificConversation';
export function handleConversationList(event: CustomEvent): Promise<void> {
    console.log('=========================handleConversationList', event);
    const platform = event.detail.platform;
    const responseBody = event.detail.responseBody;
    if (platform === 'chatgpt' && Array.isArray(responseBody.items)) {
        return handleChatgptConversationList(responseBody.items);
    }
    if (platform === 'claude' && Array.isArray(responseBody)) {
        return handleClaudeConversationList(responseBody);
    }
    return Promise.resolve();
}

export function handleSpecificConversation(event: CustomEvent): Promise<void> {
    console.log('=========================handleSpecificConversation', event);
    const platform = event.detail.platform;
    const responseBody = event.detail.responseBody;
    if (platform === 'chatgpt') {
        return handleChatgptSpecificConversation(responseBody);
    }
    if (platform === 'claude') {
        return handleClaudeSpecificConversation(responseBody);
    }
    return Promise.resolve();
}