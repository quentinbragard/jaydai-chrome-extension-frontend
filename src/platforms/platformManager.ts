import { handleChatgptConversationList } from './chatgpt/handleChatgptConversationList';
import { handleClaudeConversationList } from './claude/handleClaudeConversationList';
import { handleChatgptSpecificConversation } from './chatgpt/handleChatgptSpecificConversation';
import { handleClaudeSpecificConversation } from './claude/handleClaudeSpecificConversation';
import { handleChatgptChatCompletion } from './chatgpt/handleChatgptChatCompletion';
import { handleClaudeChatCompletion } from './claude/handleClaudeChatCompletion';
import { handleChatgptAssistantResponse } from './chatgpt/handleChatgptAssistantResponse';
import { handleClaudeAssistantResponse } from './claude/handleClaudeAssistantResponse';


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

export function handleChatCompletion(event: CustomEvent): void {
    console.log('=========================handleChatCompletion', event);
    const platform = event.detail.platform;
    if (platform === 'chatgpt') {
        handleChatgptChatCompletion(event);
    } else if (platform === 'claude') {
        handleClaudeChatCompletion(event);
    }
}

export function handleAssistantResponse(event: CustomEvent): void {
    console.log('=========================handleAssistantResponse', event);
    const platform = event.detail.platform;
    console.log("PLATFORM", platform);
    if (platform === 'chatgpt') {
        console.log("CHATGPT");
        handleChatgptAssistantResponse(event);
    } else if (platform === 'claude') {
        handleClaudeAssistantResponse(event);
    }
}