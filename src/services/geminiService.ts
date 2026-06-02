// Client-side Gemini AI interface proxy contacting the server-side proxy
// This secures the API key on the backend and improves loading performance!

export const generateHRAdvice = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch("/api/ai/advice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Server-side AI generation failed");
    }

    const data = await response.json();
    return data.text || "No advice found.";
  } catch (error) {
    console.error("Error generating HR advice:", error);
    throw error;
  }
};

export const analyzeJobDescription = async (description: string): Promise<string> => {
  try {
    const response = await fetch("/api/ai/analyze-job", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Server-side AI job analysis failed");
    }

    const data = await response.json();
    return data.text || "No analysis found.";
  } catch (error) {
    console.error("Error analyzing job description:", error);
    throw error;
  }
};
