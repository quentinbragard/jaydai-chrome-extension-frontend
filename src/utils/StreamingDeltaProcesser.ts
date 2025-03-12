class StreamingDeltaProcessor {
    private currentMessage: {
      id: string | null;
      content: string;
      conversationId: string | null;
      modelId: string | null;
      steps: Array<{
        type: 'thinking' | 'response';
        content: string;
        metadata: Record<string, any>;
      }>;
    };
  
    constructor() {
      this.resetCurrentMessage();
    }
  
    private resetCurrentMessage() {
      this.currentMessage = {
        id: null,
        content: '',
        conversationId: null,
        modelId: null,
        steps: []
      };
    }
  
    processStreamingDeltas(rawData: string) {
      const buffer = rawData;
      const eventRegex = /data: (.+)(?:\n\n|$)/g;
      
      let match;
      while ((match = eventRegex.exec(buffer)) !== null) {
        const deltaStr = match[1].trim();
        
        if (deltaStr === '[DONE]') {
          break;
        }
  
        try {
          const delta = JSON.parse(deltaStr);
          this.processDelta(delta);
        } catch (error) {
          console.error('Error parsing delta:', error);
        }
      }
    }
  
    private processDelta(delta: any) {
      // Handle message creation
      if (delta.o === 'add' && delta.v?.message) {
        const message = delta.v.message;
        
        // Reset for a new message
        this.resetCurrentMessage();
        
        // Set basic message info
        this.currentMessage.id = message.id;
        this.currentMessage.conversationId = delta.v.conversation_id;
        this.currentMessage.modelId = message.metadata?.model_slug;
      }
  
      // Handle content appending
      if (delta.o === 'append') {
        // Check different ways content might be appended
        if (delta.p?.includes('/message/content/parts/') && typeof delta.v === 'string') {
          // Append to current step's content
          if (this.currentMessage.steps.length === 0) {
            this.currentMessage.steps.push({
              type: 'response',
              content: delta.v,
              metadata: {}
            });
          } else {
            const lastStep = this.currentMessage.steps[this.currentMessage.steps.length - 1];
            lastStep.content += delta.v;
          }
        }
      }
  
      // Handle patch operations (thinking steps and final markers)
      if (delta.o === 'patch' && Array.isArray(delta.v)) {
        delta.v.forEach((patch) => {
          // Check for thinking step completion
          if (patch.p === '/message/status' && patch.v === 'finished_successfully') {
            const thinkingStep = this.currentMessage.steps.find(
              step => step.type === 'response' && !step.metadata.is_complete
            );
            
            if (thinkingStep) {
              console.log('🤔 Thinking Step:', thinkingStep.content.trim());
              thinkingStep.metadata.is_complete = true;
            }
          }
  
          // Check for final answer completion
          if (patch.p === '/message/metadata' && patch.v?.is_complete) {
            const finalAnswer = this.currentMessage.steps[this.currentMessage.steps.length - 1];
            if (finalAnswer) {
              finalAnswer.metadata = {
                ...finalAnswer.metadata,
                ...patch.v
              };
              console.log('✅ Final Answer:', finalAnswer.content.trim());
            }
          }
        });
      }
    }
  }

  export const streamingDeltaProcessor = new StreamingDeltaProcessor();