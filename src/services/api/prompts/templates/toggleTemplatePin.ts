import { apiClient } from "@/services/api/ApiClient";

export async function toggleTemplatePin(templateId: number, isPinned: boolean): Promise<any> {
  try {
    const endpoint = isPinned
      ? `/prompts/templates/unpin/${templateId}`
      : `/prompts/templates/pin/${templateId}`;

    const response = await apiClient.request(endpoint, { method: 'POST' });
    return response;
  } catch (error) {
    console.error(`Error toggling pin for template ${templateId}:`, error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
