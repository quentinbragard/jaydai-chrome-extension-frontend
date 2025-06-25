import { apiClient } from "@/services/api/ApiClient";

/**
 * Toggle pin status for a single template
 * @param templateId - ID of the template to toggle
 * @param isPinned - Current pin status (true if pinned, false if not)
 * @param type - Type of template (company, organization or user)
 */
export async function toggleTemplatePin(templateId: number, isPinned: boolean, type: 'company' | 'organization' | 'user'): Promise<any> {
  try {
    const endpoint = isPinned
      ? `/prompts/templates/unpin/${templateId}`
      : `/prompts/templates/pin/${templateId}`;

    const queryParams = `?template_type=${type}`;

    const response = await apiClient.request(`${endpoint}${queryParams}`, {
      method: 'POST',
    });

    return response;
  } catch (error) {
    console.error(`Error toggling pin for ${type} template ${templateId}:`, error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
