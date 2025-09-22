import type { SchemaItem, AttributeData } from '../types';

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
});

const callOpenAI = async (payload: object) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error("VITE_OPENAI_API_KEY not found in .env file.");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => ({}));
        const errorMessage = (errorData as { error?: { message?: string } })?.error?.message;
        throw new Error(errorMessage || `API request failed with status ${response.status}`);
    }
    return response.json();
};

const generateMasterPrompt = (schema: readonly SchemaItem[]): string => {
    const schemaInstructions = schema.map(item => `- "${item.key}": For type "${item.type}", choose from [${item.allowedValues?.map(v => `'${v}'`).join(', ')}] or determine the best value.`).join('\n');
    const example = { "neck": { "schemaValue": "POLO NECK", "rawValue": "Polo collar with buttons", "isNewDiscovery": false, "visualConfidence": 100, "mappingConfidence": 95 }, "pattern": { "schemaValue": "SOLID", "rawValue": "Solid black fabric", "isNewDiscovery": false, "visualConfidence": 100, "mappingConfidence": 100 }};
    return `You are a world-class Master Data Management specialist for a value fashion company. Analyze the image and extract its attributes with extreme precision.

Perform a two-step analysis:
1.  **Raw Visual Scan:** Identify the most accurate, literal value for each attribute key. Provide a "visualConfidence" score (0-100).
2.  **Schema Mapping:** Match your raw value to the best option from the schema below. Provide a "mappingConfidence" score (0-100).

**Schema:**
${schemaInstructions}

**Output Format:**
Respond with a clean, raw JSON object. The value for each key MUST be an object with this exact structure:
{
  "schemaValue": "The best matching value from the schema's list, or the determined text/number value.",
  "rawValue": "The raw, literal value you observed (can be null).",
  "isNewDiscovery": true if your rawValue is significantly different from the schema options, otherwise false,
  "visualConfidence": Your confidence in the rawValue (0-100),
  "mappingConfidence": Your confidence in the schemaValue match (0-100)
}
Example for a few keys: ${JSON.stringify(example)}
Analyze the user's image and provide the full JSON output.`;
};

const validateAttributes = (attributes: Record<string, unknown>, schema: readonly SchemaItem[]): attributes is AttributeData => {
    if (typeof attributes !== 'object' || attributes === null) return false;
    for (const item of schema) {
        if (!Object.prototype.hasOwnProperty.call(attributes, item.key)) return false;
        const detail = attributes[item.key];
        if (detail !== null && (typeof detail !== 'object' || !('schemaValue' in detail) || !('rawValue' in detail))) {
            return false;
        }
    }
    return true;
};

// FIX: This function now uses a single, reliable model and removes the unstable triage step.
export const extractAttributesFromImage = async (file: File, schema: readonly SchemaItem[]): Promise<{ attributes: AttributeData, tokensUsed: number, modelUsed: 'gpt-4o' | 'gpt-4o-mini' }> => {
    const base64Image = await toBase64(file);
    const modelToUse = "gpt-4o"; // Always use the powerful and reliable model.
    
    console.log(`%c[AI Extraction] Using model: ${modelToUse}`, 'color: #FF4500;');

    const prompt = generateMasterPrompt(schema);
    const payload = { model: modelToUse, messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: base64Image } }], }], max_tokens: 2048, response_format: { type: "json_object" } };
    const data = await callOpenAI(payload);

    if (!data.choices?.[0]?.message?.content) throw new Error("Invalid response structure from OpenAI API.");
    
    const parsedAttributes = JSON.parse(data.choices[0].message.content);
    if (!validateAttributes(parsedAttributes, schema)) {
        console.error("Validation Error: The AI response did not match the required data structure.", parsedAttributes);
        throw new Error("Data validation failed: The AI response was malformed.");
    }
    
    const tokensUsed = data.usage.total_tokens;
    return { attributes: parsedAttributes, tokensUsed, modelUsed: modelToUse };
};

