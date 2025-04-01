
interface TtsOptions {
  apiKey: string;
  text: string;
  voiceId: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

export async function generateSpeech(options: TtsOptions): Promise<Blob> {
  const { apiKey, text, voiceId, model = 'eleven_multilingual_v2', stability = 0.5, similarityBoost = 0.75 } = options;
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to generate speech: ${JSON.stringify(errorData)}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

export async function getVoices(apiKey: string): Promise<Voice[]> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }
    
    const data = await response.json();
    return data.voices;
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw error;
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
