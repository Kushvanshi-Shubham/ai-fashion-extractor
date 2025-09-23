import type { SchemaItem, AttributeData } from '../types';

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
});

// UPDATED: Retry mechanism for first-time API calls
const callOpenAIWithRetry = async (payload: object, maxRetries = 3) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error("VITE_OPENAI_API_KEY not found in .env file.");
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`%c[API Call] Attempt ${attempt}/${maxRetries}`, 'color: #1890ff;');
            
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${apiKey}` 
                },
                body: JSON.stringify(payload),
            });
            
            if (!response.ok) {
                const errorData: unknown = await response.json().catch(() => ({}));
                const errorMessage = (errorData as { error?: { message?: string } })?.error?.message;
                
                // ADDED: Special handling for first-time API errors
                if (attempt === 1 && response.status === 429) {
                    console.log('%c[API] Rate limit on first call, retrying...', 'color: #faad14;');
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                    continue;
                }
                
                if (response.status === 400 && errorMessage?.includes('image')) {
                    throw new Error("Image quality too low or corrupted. Please use a higher resolution image.");
                }
                
                throw new Error(errorMessage || `API request failed with status ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`%c[API Success] Attempt ${attempt} completed`, 'color: #52c41a;');
            return result;
        } catch (error) {
            console.error(`%c[API Error] Attempt ${attempt}:`, 'color: #ff4d4f;', error);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // ADDED: Progressive backoff
            const delay = attempt * 1000; // 1s, 2s, 3s
            console.log(`%c[API] Retrying in ${delay}ms...`, 'color: #faad14;');
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
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

**Important Guidelines:**
- Look carefully at image details, textures, patterns, and construction
- If image quality is poor, reduce confidence scores accordingly
- For unclear attributes, use lower confidence scores (30-60%)
- Always provide your best guess even if uncertain

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

Analyze the user's image and provide the full JSON output for ALL schema attributes.`;
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

// UPDATED: Use retry function in main extraction
export const extractAttributesFromImage = async (file: File, schema: readonly SchemaItem[]): Promise<{ attributes: AttributeData, tokensUsed: number, modelUsed: 'gpt-4o' | 'gpt-4o-mini' }> => {
    const base64Image = await toBase64(file);
    const modelToUse = "gpt-4o";
    
    console.log(`%c[AI Extraction] Using model: ${modelToUse}, Image size: ${(base64Image.length / 1024).toFixed(1)}KB`, 'color: #FF4500;');

    // ADDED: Validate base64 image
    if (!base64Image || base64Image.length < 1000) {
        throw new Error("Image file too small or corrupted. Please use a higher quality image.");
    }

    const prompt = generateMasterPrompt(schema);
    const payload = { 
        model: modelToUse, 
        messages: [{ 
            role: "user", 
            content: [
                { type: "text", text: prompt }, 
                { type: "image_url", image_url: { url: base64Image } }
            ] 
        }], 
        max_tokens: 2048,
        temperature: 0.1, // ADDED: Lower temperature for more consistent results
        response_format: { type: "json_object" } 
    };
    
    // CHANGED: Use retry function
    const data = await callOpenAIWithRetry(payload);

    if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid response structure from OpenAI API. Please try again.");
    }
    
    let parsedAttributes;
    try {
        parsedAttributes = JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error("JSON Parse Error:", data.choices[0].message.content);
        throw new Error("AI response was not valid JSON. Please try with a clearer image.");
    }
    
    if (!validateAttributes(parsedAttributes, schema)) {
        console.error("Validation Error: The AI response did not match the required data structure.", parsedAttributes);
        throw new Error("AI response validation failed. The image might be unclear or not suitable for analysis.");
    }
    
    const tokensUsed = data.usage?.total_tokens || 0;
    console.log(`%c[AI Success] Tokens used: ${tokensUsed}`, 'color: #52c41a;');
    return { attributes: parsedAttributes, tokensUsed, modelUsed: modelToUse };
};
