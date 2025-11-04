import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CanvasElement, TextElement } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper to parse a data URI (e.g., "data:image/png;base64,iVBOR...")
const parseDataUri = (dataUri: string): { mimeType: string; data: string } | null => {
  const match = dataUri.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
};

export const generateImageWithAI = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("AI did not return an image.");
  } catch (error) {
    console.error("Error with Gemini API (generateImageWithAI):", error);
    throw new Error("Failed to generate image using AI.");
  }
};


export const editImageWithAI = async (currentImageSrc: string, prompt: string): Promise<string> => {
  const imageParts = parseDataUri(currentImageSrc);
  if (!imageParts) {
    throw new Error("Invalid image source format. Only base64 data URIs are supported for AI editing.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageParts.data,
              mimeType: imageParts.mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error("AI did not return an edited image.");

  } catch (error) {
    console.error("Error with Gemini API (editImageWithAI):", error);
    throw new Error("Failed to edit image using AI.");
  }
};

export const placeContentWithAI = async (elements: CanvasElement[], userContent: string): Promise<Record<string, string>> => {
  const textElements = elements.filter(el => el.type === 'text').map(el => ({ id: el.id, content: (el as TextElement).content }));

  if (textElements.length === 0) {
    console.warn("No text elements on canvas to place content.");
    return {};
  }
  
  // FIX: Updated prompt to request a JSON array of objects for better schema definition.
  const prompt = `You are an intelligent content placement assistant for a design tool.
  Below is a list of placeholder text elements on a design canvas, represented as a JSON array. Each element has an ID.
  Also provided is a block of text. Your task is to analyze the text, break it down into logical parts (like a title, a subtitle, a paragraph), and assign each part to the most appropriate placeholder element on the canvas.
  Return a JSON array of objects, where each object has an "id" property (the element ID) and a "content" property (the text content that should go into it). Only assign content to the provided text element IDs.

  Canvas Elements:
  ${JSON.stringify(textElements)}

  User Content:
  "${userContent}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // FIX: Updated schema to conform to API guidelines. Instead of an object with dynamic keys (which required an empty properties object), we now expect an array of objects with defined properties.
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'The ID of the canvas element.' },
              content: { type: Type.STRING, description: 'The text content to place in the element.' }
            },
            required: ['id', 'content']
          }
        },
      },
    });
    const resultText = response.text.trim();
    // FIX: Process the array response and convert it to the required Record<string, string> map.
    const resultArray: { id: string; content: string }[] = JSON.parse(resultText);
    const contentMap: Record<string, string> = {};
    for (const item of resultArray) {
      contentMap[item.id] = item.content;
    }
    return contentMap;
  } catch (error) {
    console.error("Error with Gemini API (placeContentWithAI):", error);
    throw new Error("Failed to place content using AI.");
  }
};

export const applyStylesWithAI = async (element: CanvasElement, command: string): Promise<Partial<CanvasElement>> => {
  const prompt = `You are a design assistant that translates natural language commands into JSON style updates for a design element.
  Below is the JSON representation of the currently selected design element. Based on the user's command, generate a JSON object with the properties that need to be updated.
  - Only return changed properties.
  - For colors, use hex codes (e.g., '#FF0000').
  - For 'fontSize', 'width', 'height', 'rotation', 'lineHeight', 'letterSpacing', use a number.
  - For 'fontWeight', use 'normal' or 'bold'.
  - For 'fontStyle', use 'normal' or 'italic'.
  - For 'textTransform', use 'none', 'uppercase', or 'lowercase'.
  - For 'fontFamily', suggest a common web font like 'Arial', 'Verdana', 'Georgia', 'Times New Roman', or 'Courier New'.

  Selected Element:
  ${JSON.stringify(element, null, 2)}

  User Command:
  "${command}"
  `;

  const properties: Record<string, { type: Type, description: string }> = {
    color: { type: Type.STRING, description: "Hex color code" },
    fontSize: { type: Type.NUMBER, description: "Font size in pixels" },
    fontWeight: { type: Type.STRING, description: "'normal' or 'bold'" },
    fontStyle: { type: Type.STRING, description: "'normal' or 'italic'" },
    fontFamily: { type: Type.STRING, description: "CSS font family" },
    lineHeight: { type: Type.NUMBER, description: "Line height (e.g. 1.5 for 150%)" },
    letterSpacing: { type: Type.NUMBER, description: "Letter spacing in pixels" },
    textTransform: { type: Type.STRING, description: "'none', 'uppercase', or 'lowercase'" },
    width: { type: Type.NUMBER, description: "Width in pixels" },
    height: { type: Type.NUMBER, description: "Height in pixels" },
    rotation: { type: Type.NUMBER, description: "Rotation in degrees" },
    content: { type: Type.STRING, description: "The text content of the element" }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: properties,
          description: "An object containing the style properties to update."
        }
      },
    });
    const resultText = response.text.trim();
    return JSON.parse(resultText);
  } catch (error)
{
    console.error("Error with Gemini API (applyStylesWithAI):", error);
    throw new Error("Failed to apply styles using AI.");
  }
};

export const applyBulkStylesWithAI = async (elements: CanvasElement[], command: string): Promise<Partial<CanvasElement>[]> => {
  const prompt = `You are a design assistant that translates natural language commands into JSON style updates for multiple design elements.
  Below is a JSON array of the currently selected design elements. Based on the user's command, generate a JSON array of objects. Each object in the array MUST have an "id" property corresponding to one of the input elements, and any other properties that need to be updated for that element.

  - Only return changed properties.
  - For alignment/distribution, calculate new coordinates. For example, for "align left", all elements should get the same 'x' coordinate of the leftmost element.
  - For colors, use hex codes (e.g., '#FF0000').
  - For numerical values like 'fontSize', 'width', 'height', 'rotation', 'lineHeight', 'letterSpacing', use a number.
  - For 'fontWeight', use 'normal' or 'bold'.
  - For 'fontStyle', use 'normal' or 'italic'.
  - For 'textTransform', use 'none', 'uppercase', or 'lowercase'.

  Selected Elements:
  ${JSON.stringify(elements.map(({ id, type, x, y, width, height }) => ({ id, type, x, y, width, height })), null, 2)}

  User Command:
  "${command}"
  `;

  // A generic properties object for the response schema
  const properties: Record<string, { type: Type, description: string }> = {
    id: { type: Type.STRING, description: "The ID of the element to update. This is required." },
    x: { type: Type.NUMBER, description: "X coordinate" },
    y: { type: Type.NUMBER, description: "Y coordinate" },
    width: { type: Type.NUMBER, description: "Width in pixels" },
    height: { type: Type.NUMBER, description: "Height in pixels" },
    rotation: { type: Type.NUMBER, description: "Rotation in degrees" },
    color: { type: Type.STRING, description: "Hex color code" },
    fontSize: { type: Type.NUMBER, description: "Font size in pixels" },
    fontWeight: { type: Type.STRING, description: "'normal' or 'bold'" },
    fontStyle: { type: Type.STRING, description: "'normal' or 'italic'" },
    fontFamily: { type: Type.STRING, description: "CSS font family" },
    lineHeight: { type: Type.NUMBER, description: "Line height (e.g. 1.5 for 150%)" },
    letterSpacing: { type: Type.NUMBER, description: "Letter spacing in pixels" },
    textTransform: { type: Type.STRING, description: "'none', 'uppercase', or 'lowercase'" },
    content: { type: Type.STRING, description: "The text content of the element" }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // Using pro for better reasoning on complex tasks like alignment
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: properties,
            required: ['id'],
          }
        },
      },
    });
    const resultText = response.text.trim();
    if (!resultText) {
        console.warn("Gemini API returned an empty response for bulk style update.");
        return [];
    }
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Error with Gemini API (applyBulkStylesWithAI):", error);
    throw new Error("Failed to apply bulk styles using AI.");
  }
};