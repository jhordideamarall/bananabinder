/**
 * Fonnte API Client for sending WhatsApp messages.
 */
export interface FonnteResponse {
  status: boolean;
  message: string;
}

export class FonnteClient {
  private token: string;
  private baseUrl = "https://api.fonnte.com/send";

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Sends a WhatsApp message to a phone number.
   * Phone number should be in international format without '+' (e.g., 628123456789).
   */
  async sendMessage(target: string, message: string): Promise<FonnteResponse> {
    if (!this.token) {
      console.warn("Fonnte token is missing. Message will not be sent.");
      return { status: false, message: "Fonnte token is missing" };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: this.token,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          target,
          message,
        }),
      });

      const data = await response.json();
      return data as FonnteResponse;
    } catch (error) {
      console.error("Fonnte API Error:", error);
      return { status: false, message: "Failed to connect to Fonnte API" };
    }
  }
}
